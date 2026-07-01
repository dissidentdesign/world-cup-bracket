// Cloudflare Worker: ESPN proxy for the World Cup bracket app.
//
// ESPN's public scoreboard/standings/teams endpoints don't require auth and
// aren't rate-limited the way API-Football is. We fetch three endpoints,
// normalize into the snapshot shape the frontend consumes, and cache at the
// edge for 15 minutes. A long-lived stale cache serves stale data if ESPN
// ever errors so the page keeps working.

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const ESPN_STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const DEFAULT_SEASON = 2026;
const SNAPSHOT_CACHE_TTL_SECONDS = 900;      // 15 minutes when nothing is live
const LIVE_CACHE_TTL_SECONDS = 30;           // 30 seconds while any match is in progress
const STALE_CACHE_TTL_SECONDS = 86400;       // 24h stale-on-error fallback
const CACHE_VERSION = "v7-live";

const ROUND_SLUG_TO_KEY = {
  "round-of-32": "R32",
  "round-of-16": "R16",
  "quarter-finals": "QF",
  "quarterfinals": "QF",
  "semi-finals": "SF",
  "semifinals": "SF",
  "third-place": "TP",
  "final": "F",
};
const ROUND_KEY_ORDER = ["R32", "R16", "QF", "SF", "TP", "F"];
const ROUND_KEY_LABEL = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  TP: "Third place",
  F: "Final",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    const url = new URL(request.url);
    if (url.pathname === "/api/snapshot" && request.method === "GET") {
      return handleSnapshot(request, env, ctx, url);
    }
    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, upstream: "espn" });
    }
    return jsonResponse({ error: "Not found" }, 404);
  },
};

async function handleSnapshot(request, env, ctx, url) {
  const season = Number(url.searchParams.get("season")) || DEFAULT_SEASON;
  const refresh = url.searchParams.get("refresh") === "1";
  const cache = caches.default;
  const cacheKey = new Request(`https://snapshot.cache/${CACHE_VERSION}/season=${season}`, { method: "GET" });
  const staleKey = new Request(`https://snapshot.cache/${CACHE_VERSION}/season=${season}/stale`, { method: "GET" });

  if (!refresh) {
    const cached = await cache.match(cacheKey);
    if (cached) return withClientHeaders(cached);
  }

  let snapshot;
  try {
    snapshot = await buildSnapshot(season);
  } catch (err) {
    const stale = await cache.match(staleKey);
    if (stale) {
      const body = await stale.text();
      return jsonResponse(JSON.parse(body), 200, {
        "Cache-Control": "no-store",
        "X-Stale-Reason": String(err).slice(0, 160),
      });
    }
    return jsonResponse({ error: "Upstream fetch failed", detail: String(err) }, 502);
  }

  const body = JSON.stringify(snapshot);
  const freshTtl = snapshot.hasLive ? LIVE_CACHE_TTL_SECONDS : SNAPSHOT_CACHE_TTL_SECONDS;
  ctx.waitUntil(cache.put(cacheKey, new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${freshTtl}`,
    },
  })));
  ctx.waitUntil(cache.put(staleKey, new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${STALE_CACHE_TTL_SECONDS}`,
    },
  })));

  return jsonResponse(snapshot, 200, { "Cache-Control": "no-store" });
}

async function buildSnapshot(season) {
  // WC2026 runs June 11 - July 19, 2026. Broaden by a couple of days to be safe.
  const dates = `${season}0601-${season}0725`;
  const [scoreboardWide, standings, teamsData] = await Promise.all([
    espnFetch(`${ESPN_BASE}/scoreboard?dates=${dates}&limit=200`),
    espnFetch(ESPN_STANDINGS),
    espnFetch(`${ESPN_BASE}/teams?limit=64`),
  ]);
  const events = scoreboardWide?.events || [];

  const teams = collectTeams(teamsData);
  attachStandings(teams, standings);
  const normalizedEvents = events.map(normalizeEvent).filter(Boolean);
  attachTeamFixtures(teams, normalizedEvents);
  attachAggregateStats(teams);
  const bracket = buildBracket(normalizedEvents);
  attachEliminationState(teams, bracket);
  attachTeamStage(teams, bracket);
  attachNextFixture(teams, normalizedEvents);
  attachTopScorers(teams, events);

  const liveMatches = normalizedEvents
    .filter((m) => m.live)
    .map((m) => ({
      eventId: m.eventId,
      status: m.status,
      displayClock: m.displayClock,
      home: { code: m.home.code, name: m.home.name, score: m.home.score },
      away: { code: m.away.code, name: m.away.name, score: m.away.score },
      round: m.roundLabel || m.round,
    }));

  return {
    generatedAt: new Date().toISOString(),
    season,
    upstream: "espn",
    hasLive: liveMatches.length > 0,
    liveMatches,
    teams,
    bracket,
  };
}

// ---------- team seed ----------

function collectTeams(teamsData) {
  const list = teamsData?.sports?.[0]?.leagues?.[0]?.teams || [];
  const teams = {};
  for (const wrapper of list) {
    const t = wrapper.team || {};
    const code = (t.abbreviation || "").toUpperCase();
    if (!code) continue;
    teams[code] = {
      code,
      apiId: t.id || null,
      name: t.displayName || code,
      shortName: t.shortDisplayName || t.name || t.displayName || code,
      logo: t.logos?.[0]?.href || t.logo || null,
      color: t.color ? `#${t.color}` : null,
    };
  }
  return teams;
}

// ---------- standings → group table + stats ----------

function attachStandings(teams, standings) {
  const groups = standings?.children || [];
  for (const group of groups) {
    const groupName = group.name || group.abbreviation || "";
    const entries = group.standings?.entries || [];

    // Build the group table once (all four teams), sorted by rank.
    const table = entries
      .map((e) => {
        const stats = statsMap(e.stats);
        return {
          code: (e.team?.abbreviation || "").toUpperCase(),
          name: e.team?.displayName || null,
          position: intOrNull(stats.R) ?? 0,
          played: intOrNull(stats.GP) ?? 0,
          wins: intOrNull(stats.W) ?? 0,
          draws: intOrNull(stats.D) ?? 0,
          losses: intOrNull(stats.L) ?? 0,
          gf: intOrNull(stats.F) ?? 0,
          ga: intOrNull(stats.A) ?? 0,
          gd: intOrNull(stats.GD) ?? 0,
          pts: intOrNull(stats.P) ?? 0,
          advanced: intOrNull(stats.ADV) === 1,
        };
      })
      .sort((a, b) => a.position - b.position);

    for (const e of entries) {
      const code = (e.team?.abbreviation || "").toUpperCase();
      if (!code || !teams[code]) continue;
      const stats = statsMap(e.stats);
      teams[code].group = groupName;
      teams[code].groupRank = intOrNull(stats.R) ?? 0;
      teams[code].advancedFromGroup = intOrNull(stats.ADV) === 1;
      teams[code].groupTable = table;
    }
  }
}

function statsMap(stats) {
  const map = {};
  for (const s of stats || []) {
    if (s?.abbreviation) map[s.abbreviation] = s.displayValue ?? s.value;
  }
  return map;
}

function intOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ---------- events → per-team fixtures + bracket ----------

function normalizeEvent(e) {
  const comp = e.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors?.find((c) => c.homeAway === "home");
  const away = comp.competitors?.find((c) => c.homeAway === "away");
  if (!home || !away) return null;
  const statusObj = comp.status || {};
  const status = statusObj.type || {};
  const roundKey = ROUND_SLUG_TO_KEY[e.season?.slug] || null;
  const roundLabel = ROUND_KEY_LABEL[roundKey] || cleanRoundName(e.season?.slug);
  const venue = comp.venue?.fullName
    ? `${comp.venue.fullName}${comp.venue.address?.city ? `, ${comp.venue.address.city}` : ""}`
    : null;
  const broadcasts = comp.broadcasts?.[0]?.names || [];
  const winner = home.winner ? "home" : away.winner ? "away" : null;
  return {
    eventId: e.id,
    date: e.date,
    dateTs: e.date ? Date.parse(e.date) : 0,
    round: e.season?.slug || null,
    roundKey,
    roundLabel,
    status: status.shortDetail || status.detail || "TBD",
    statusState: status.state || null,             // "pre" | "in" | "post"
    statusDetail: status.detail || null,           // "1st Half", "Halftime", "FT", …
    displayClock: statusObj.displayClock || null,  // "38'", "HT", "90'+3'"
    period: statusObj.period ?? null,
    live: status.state === "in",
    completed: status.completed === true,
    winner,
    venue,
    broadcasts,
    home: sideOf(home),
    away: sideOf(away),
  };
}

function cleanRoundName(slug) {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sideOf(competitor) {
  const t = competitor.team || {};
  const score = competitor.score != null && competitor.score !== ""
    ? Number(competitor.score)
    : null;
  return {
    code: (t.abbreviation || "").toUpperCase() || null,
    name: t.displayName || null,
    logo: t.logo || null,
    color: t.color ? `#${t.color}` : null,
    score,
    winner: competitor.winner === true,
    advanced: competitor.advance === true,
    form: competitor.form || null,
  };
}

function attachTeamFixtures(teams, events) {
  for (const m of events) {
    push(teams, m.home.code, m, "home", m.away);
    push(teams, m.away.code, m, "away", m.home);
  }
  // Newest first so the panel opens with the upcoming (or most recent)
  // fixture at the top of the Tournament Path list.
  for (const team of Object.values(teams)) {
    (team.fixtures || []).sort((a, b) => b.dateTs - a.dateTs);
  }
}

function push(teams, code, match, side, opp) {
  if (!code || !teams[code]) return;
  if (!teams[code].fixtures) teams[code].fixtures = [];
  const mine = match[side];
  let result = null;
  if (match.completed && mine.score != null && opp.score != null) {
    if (match.winner) {
      result = match.winner === side ? "W" : "L";
    } else if (mine.score > opp.score) result = "W";
    else if (mine.score < opp.score) result = "L";
    else result = "D";
  }
  teams[code].fixtures.push({
    eventId: match.eventId,
    date: match.date,
    dateTs: match.dateTs,
    round: match.roundLabel || match.round,
    roundKey: match.roundKey,
    opponent: opp.name,
    opponentCode: opp.code,
    venue: match.venue,
    status: match.status,
    statusState: match.statusState,
    displayClock: match.displayClock,
    live: match.live,
    myScore: mine.score,
    oppScore: opp.score,
    result,
    home: side === "home",
    broadcasts: match.broadcasts,
  });
}

function attachAggregateStats(teams) {
  for (const team of Object.values(teams)) {
    const fixtures = team.fixtures || [];
    const agg = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 };
    for (const f of fixtures) {
      if (!f.result) continue;
      agg.played += 1;
      if (f.result === "W") agg.wins += 1;
      else if (f.result === "L") agg.losses += 1;
      else if (f.result === "D") agg.draws += 1;
      agg.gf += f.myScore ?? 0;
      agg.ga += f.oppScore ?? 0;
    }
    agg.gd = agg.gf - agg.ga;
    team.aggregateStats = agg;
  }
}

function buildBracket(events) {
  const grouped = {};
  for (const m of events) {
    if (!m.roundKey) continue;
    if (!grouped[m.roundKey]) grouped[m.roundKey] = [];
    grouped[m.roundKey].push(m);
  }

  const rounds = [];
  for (const key of ROUND_KEY_ORDER) {
    const matches = grouped[key];
    if (!matches?.length) continue;
    matches.sort((a, b) => a.dateTs - b.dateTs || String(a.eventId).localeCompare(String(b.eventId)));
    rounds.push({
      key,
      name: ROUND_KEY_LABEL[key],
      matches: matches.map((m) => ({
        eventId: m.eventId,
        fixtureId: m.eventId,
        date: m.date,
        venue: m.venue,
        status: m.status,
        statusState: m.statusState,
        displayClock: m.displayClock,
        period: m.period,
        live: m.live,
        home: { code: m.home.code, name: m.home.name, logo: m.home.logo, score: m.home.score },
        away: { code: m.away.code, name: m.away.name, logo: m.away.logo, score: m.away.score },
        winner: m.winner,
        broadcasts: m.broadcasts,
      })),
    });
  }
  return { rounds };
}

function attachEliminationState(teams, bracket) {
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.winner === null || match.winner === undefined) continue;
      const losing = match.winner === "home" ? match.away : match.home;
      const winning = match.winner === "home" ? match.home : match.away;
      if (losing.code && teams[losing.code]) {
        teams[losing.code].eliminated = true;
        teams[losing.code].eliminatedAt = round.name;
        teams[losing.code].eliminatedBy = winning.name;
      }
    }
  }
}

function attachTeamStage(teams, bracket) {
  for (const round of bracket.rounds) {
    const rank = ROUND_KEY_ORDER.indexOf(round.key);
    if (rank < 0) continue;
    for (const match of round.matches) {
      for (const side of ["home", "away"]) {
        const code = match[side].code;
        if (!code || !teams[code]) continue;
        if ((teams[code].stageRank ?? -1) >= rank) continue;
        teams[code].stage = ROUND_KEY_LABEL[round.key];
        teams[code].stageKey = round.key;
        teams[code].stageRank = rank;
      }
    }
  }
}

function attachNextFixture(teams, events) {
  const now = Date.now();
  const byTeam = new Map();
  for (const m of events) {
    if (m.completed) continue;
    if (!m.dateTs || m.dateTs < now - 60 * 60 * 1000) continue; // ignore anything more than an hour past
    consider(byTeam, m.home.code, m, "home", m.away);
    consider(byTeam, m.away.code, m, "away", m.home);
  }
  for (const [code, entry] of byTeam.entries()) {
    if (!teams[code]) continue;
    teams[code].nextFixture = entry;
  }
}

function consider(byTeam, code, match, side, opp) {
  if (!code) return;
  const current = byTeam.get(code);
  if (current && current.dateTs <= match.dateTs) return;
  byTeam.set(code, {
    dateTs: match.dateTs,
    date: match.date,
    opponent: opp.name,
    opponentCode: opp.code,
    venue: match.venue,
    status: match.status,
    round: match.roundLabel || match.round,
    broadcasts: match.broadcasts || [],
  });
}

// ---------- top scorers (from ESPN 'leaders' if present) ----------

function attachTopScorers(teams, events) {
  // ESPN's scoreboard doesn't expose per-team tournament scorer leaders in a
  // stable, easy-to-consume shape on the free endpoint. Skip for now; the
  // panel already tolerates a missing topScorer.
  //
  // (Intentionally left blank so we don't invent numbers.)
  void teams; void events;
}

// ---------- fetch helper ----------

async function espnFetch(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    // Keep upstream cache short so live match clocks/scores can update. Our
    // snapshot cache above already dedupes bursts of clients.
    cf: { cacheTtl: 15, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`ESPN ${url} ${response.status}`);
  return response.json();
}

// ---------- response helpers ----------

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function withClientHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}
