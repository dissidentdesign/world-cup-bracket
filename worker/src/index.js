// Cloudflare Worker: API-Football proxy for the World Cup bracket app.
//
// Exposes one endpoint, GET /api/snapshot, which returns a normalized JSON
// blob keyed by FIFA 3-letter code. Upstream calls hit API-Football
// (v3.football.api-sports.io) using a key stored as a Worker secret.
// Responses are cached at the edge so a real surge of users costs us only a
// handful of upstream calls per refresh interval.

const API_BASE = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1; // FIFA World Cup
const DEFAULT_SEASON = 2026;
const SNAPSHOT_CACHE_TTL_SECONDS = 900; // 15 minutes
const STALE_CACHE_TTL_SECONDS = 86400; // Serve stale snapshots for 24h if upstream errors.
const CACHE_VERSION = "v5"; // Bump whenever the snapshot shape changes.

const KNOCKOUT_ROUNDS = [
  { key: "R32", patterns: [/round of 32/i] },
  { key: "R16", patterns: [/round of 16/i, /1\/8 finals/i] },
  { key: "QF", patterns: [/quarter-?finals?/i, /1\/4 finals/i] },
  { key: "SF", patterns: [/semi-?finals?/i, /1\/2 finals/i] },
  { key: "TP", patterns: [/3rd place/i, /third place/i] },
  { key: "F", patterns: [/^final/i] },
];

const ROUND_LABELS = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  TP: "Third place",
  F: "Final",
};

// FIFA 3-letter codes the frontend already uses. We only return teams whose
// API-Football `code` is in this set; everything else is dropped so the
// bracket stays clean even if the upstream returns extras.
const KNOWN_CODES = new Set([
  "USA", "MEX", "ARG", "GER", "ESP", "POR", "FRA", "SEN",
  "BRA", "CAN", "ENG", "JPN", "NED", "MAR", "COL", "BEL",
  "URU", "AUS", "SUI", "KOR", "CRO", "POL", "DEN", "NGA",
  "ECU", "GHA", "EGY", "ALG", "SWE", "NOR", "QAT", "KSA",
]);

// API-Football's `team.code` is often an ISO 2-letter or otherwise diverges
// from FIFA's 3-letter codes (e.g. "BR" not "BRA"). Map normalized team
// names to our canonical FIFA codes for the 32 teams the bracket renders.
const NAME_TO_CODE = {
  "united states": "USA", "usa": "USA",
  "mexico": "MEX",
  "argentina": "ARG",
  "germany": "GER",
  "spain": "ESP",
  "portugal": "POR",
  "france": "FRA",
  "senegal": "SEN",
  "brazil": "BRA",
  "canada": "CAN",
  "england": "ENG",
  "japan": "JPN",
  "netherlands": "NED", "holland": "NED",
  "morocco": "MAR",
  "colombia": "COL",
  "belgium": "BEL",
  "uruguay": "URU",
  "australia": "AUS",
  "switzerland": "SUI",
  "south korea": "KOR", "korea republic": "KOR", "korea, south": "KOR",
  "croatia": "CRO",
  "poland": "POL",
  "denmark": "DEN",
  "nigeria": "NGA",
  "ecuador": "ECU",
  "ghana": "GHA",
  "egypt": "EGY",
  "algeria": "ALG",
  "sweden": "SWE",
  "norway": "NOR",
  "qatar": "QAT",
  "saudi arabia": "KSA",
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
      return jsonResponse({ ok: true });
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

  if (!env.API_FOOTBALL_KEY) {
    return jsonResponse(
      { error: "Worker not configured: API_FOOTBALL_KEY secret is missing." },
      500,
    );
  }

  let snapshot;
  try {
    snapshot = await buildSnapshot(env.API_FOOTBALL_KEY, season);
  } catch (err) {
    // Upstream failed (usually rate-limit). Fall back to the 24h stale
    // cache if we have one, so the page keeps working instead of going
    // dark until the quota resets.
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

  // Fresh copy for the edge (5-min TTL).
  ctx.waitUntil(cache.put(cacheKey, new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${SNAPSHOT_CACHE_TTL_SECONDS}`,
    },
  })));

  // Long-lived stale copy, only served when upstream errors.
  ctx.waitUntil(cache.put(staleKey, new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${STALE_CACHE_TTL_SECONDS}`,
    },
  })));

  return jsonResponse(snapshot, 200, {
    "Cache-Control": "no-store",
  });
}

async function buildSnapshot(apiKey, season) {
  const [standings, fixtures, scorers, assisters] = await Promise.all([
    apiFootball(apiKey, "/standings", { league: LEAGUE_ID, season }),
    apiFootball(apiKey, "/fixtures", { league: LEAGUE_ID, season }),
    apiFootball(apiKey, "/players/topscorers", { league: LEAGUE_ID, season }),
    apiFootball(apiKey, "/players/topassists", { league: LEAGUE_ID, season }),
  ]);

  const teams = collectTeams(standings, fixtures);
  attachStandings(teams, standings);
  attachNextFixtures(teams, fixtures);
  attachTopScorers(teams, scorers);
  attachTopAssisters(teams, assisters);
  attachTeamFixtures(teams, fixtures);
  attachAggregateStats(teams);
  attachGroupStandings(teams, fixtures);
  const bracket = buildBracket(fixtures);
  attachEliminationState(teams, bracket);
  attachTeamStage(teams, bracket);

  return {
    generatedAt: new Date().toISOString(),
    season,
    leagueId: LEAGUE_ID,
    teams,
    bracket,
  };
}

function classifyRound(round) {
  if (!round) return null;
  for (const { key, patterns } of KNOCKOUT_ROUNDS) {
    if (patterns.some((p) => p.test(round))) return key;
  }
  return null;
}

function buildBracket(fixtures) {
  const grouped = {};
  for (const m of fixtures?.response ?? []) {
    const key = classifyRound(m.league?.round);
    if (!key) continue;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  const rounds = [];
  for (const { key } of KNOCKOUT_ROUNDS) {
    const matches = grouped[key];
    if (!matches?.length) continue;
    matches.sort((a, b) => Date.parse(a.fixture?.date || 0) - Date.parse(b.fixture?.date || 0)
      || (a.fixture?.id ?? 0) - (b.fixture?.id ?? 0));
    rounds.push({
      key,
      name: ROUND_LABELS[key],
      matches: matches.map(normalizeMatch),
    });
  }
  return { rounds };
}

function normalizeMatch(m) {
  const home = m.teams?.home || {};
  const away = m.teams?.away || {};
  const winner = home.winner === true ? "home" : away.winner === true ? "away" : null;
  return {
    fixtureId: m.fixture?.id ?? null,
    date: m.fixture?.date ?? null,
    venue: m.fixture?.venue?.name
      ? `${m.fixture.venue.name}${m.fixture.venue.city ? `, ${m.fixture.venue.city}` : ""}`
      : null,
    status: m.fixture?.status?.short ?? "NS",
    home: {
      code: resolveCode(home),
      name: home.name ?? null,
      logo: home.logo ?? null,
      score: m.goals?.home ?? null,
    },
    away: {
      code: resolveCode(away),
      name: away.name ?? null,
      logo: away.logo ?? null,
      score: m.goals?.away ?? null,
    },
    winner,
  };
}

function attachEliminationState(teams, bracket) {
  // A team is eliminated if their last completed knockout match was a loss.
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.status !== "FT" && match.status !== "AET" && match.status !== "PEN") continue;
      if (!match.winner) continue;
      const losingSide = match.winner === "home" ? match.away : match.home;
      const winningSide = match.winner === "home" ? match.home : match.away;
      if (losingSide.code && teams[losingSide.code]) {
        teams[losingSide.code].eliminated = true;
        teams[losingSide.code].eliminatedAt = round.name;
        teams[losingSide.code].eliminatedBy = winningSide.name;
      }
    }
  }
}

function collectTeams(standings, fixtures) {
  const teams = {};

  const upsert = (raw) => {
    if (!raw) return;
    const code = resolveCode(raw);
    if (!code) return;
    if (!teams[code]) {
      teams[code] = {
        code,
        apiId: raw.id,
        name: raw.name,
        logo: raw.logo || null,
      };
    }
  };

  for (const league of standings?.response ?? []) {
    for (const group of league.league?.standings ?? []) {
      for (const row of group) upsert(row.team);
    }
  }
  for (const match of fixtures?.response ?? []) {
    upsert(match.teams?.home);
    upsert(match.teams?.away);
  }

  return teams;
}

function attachStandings(teams, standings) {
  for (const league of standings?.response ?? []) {
    for (const group of league.league?.standings ?? []) {
      for (const row of group) {
        const code = resolveCode(row.team);
        if (!code || !teams[code]) continue;
        teams[code].stats = {
          played: row.all?.played ?? 0,
          wins: row.all?.win ?? 0,
          draws: row.all?.draw ?? 0,
          losses: row.all?.lose ?? 0,
          goalsFor: row.all?.goals?.for ?? 0,
          goalsAgainst: row.all?.goals?.against ?? 0,
          points: row.points ?? 0,
        };
        if (row.form) teams[code].form = row.form;
        if (row.group) teams[code].group = row.group;
        if (row.rank != null) teams[code].groupRank = row.rank;
      }
    }
  }
}

function attachNextFixtures(teams, fixtures) {
  const now = Date.now();
  const byTeam = new Map();

  for (const match of fixtures?.response ?? []) {
    const date = match.fixture?.date ? Date.parse(match.fixture.date) : NaN;
    if (Number.isNaN(date)) continue;

    const homeCode = resolveCode(match.teams?.home);
    const awayCode = resolveCode(match.teams?.away);
    const venue = match.fixture?.venue?.name
      ? `${match.fixture.venue.name}${match.fixture.venue.city ? `, ${match.fixture.venue.city}` : ""}`
      : null;

    const statusShort = match.fixture?.status?.short ?? "NS";
    const isUpcoming = date >= now && ["NS", "TBD", "PST"].includes(statusShort);

    // Last completed match for "recent" lookup
    if (homeCode && teams[homeCode] && !isUpcoming) {
      const prior = teams[homeCode].lastMatch;
      if (!prior || prior.dateTs < date) {
        teams[homeCode].lastMatch = {
          dateTs: date,
          opponent: match.teams?.away?.name,
          venue,
          status: statusShort,
          score: scoreString(match, "home"),
        };
      }
    }
    if (awayCode && teams[awayCode] && !isUpcoming) {
      const prior = teams[awayCode].lastMatch;
      if (!prior || prior.dateTs < date) {
        teams[awayCode].lastMatch = {
          dateTs: date,
          opponent: match.teams?.home?.name,
          venue,
          status: statusShort,
          score: scoreString(match, "away"),
        };
      }
    }

    if (!isUpcoming) continue;

    const consider = (code, opponent) => {
      if (!code || !teams[code]) return;
      const current = byTeam.get(code);
      if (current && current.dateTs <= date) return;
      byTeam.set(code, {
        dateTs: date,
        date: match.fixture.date,
        opponent,
        venue,
        status: statusShort,
        round: match.league?.round || null,
      });
    };

    consider(homeCode, match.teams?.away?.name);
    consider(awayCode, match.teams?.home?.name);
  }

  for (const [code, fixture] of byTeam.entries()) {
    teams[code].nextFixture = fixture;
  }
}

function attachTopScorers(teams, scorers) {
  // API-Football returns the top scorers in the tournament. Pick the leading
  // scorer per team if they appear in the list.
  for (const row of scorers?.response ?? []) {
    const code = resolveCode(row.statistics?.[0]?.team);
    if (!code || !teams[code]) continue;
    const goals = row.statistics?.[0]?.goals?.total ?? 0;
    const existing = teams[code].topScorer;
    if (existing && existing.goals >= goals) continue;
    teams[code].topScorer = { name: row.player?.name, goals };
  }
}

function attachTopAssisters(teams, assisters) {
  for (const row of assisters?.response ?? []) {
    const code = resolveCode(row.statistics?.[0]?.team);
    if (!code || !teams[code]) continue;
    const assists = row.statistics?.[0]?.goals?.assists ?? 0;
    const existing = teams[code].topAssister;
    if (existing && existing.assists >= assists) continue;
    teams[code].topAssister = { name: row.player?.name, assists };
  }
}

function attachTeamFixtures(teams, fixtures) {
  for (const m of fixtures?.response ?? []) {
    const homeCode = resolveCode(m.teams?.home);
    const awayCode = resolveCode(m.teams?.away);
    const round = m.league?.round || null;
    const date = m.fixture?.date || null;
    const status = m.fixture?.status?.short || "NS";
    const venue = m.fixture?.venue?.name
      ? `${m.fixture.venue.name}${m.fixture.venue.city ? `, ${m.fixture.venue.city}` : ""}`
      : null;
    const homeGoals = m.goals?.home;
    const awayGoals = m.goals?.away;
    const isCompleted = ["FT", "AET", "PEN"].includes(status);

    const push = (code, isHome) => {
      if (!code || !teams[code]) return;
      if (!teams[code].fixtures) teams[code].fixtures = [];
      const myScore = isHome ? homeGoals : awayGoals;
      const oppScore = isHome ? awayGoals : homeGoals;
      const oppName = isHome ? m.teams?.away?.name : m.teams?.home?.name;
      let result = null;
      if (isCompleted && myScore != null && oppScore != null) {
        // PEN results need the explicit winner flag — scores can be level.
        if (status === "PEN") {
          const myWinner = isHome ? m.teams?.home?.winner : m.teams?.away?.winner;
          result = myWinner ? "W" : "L";
        } else if (myScore > oppScore) {
          result = "W";
        } else if (myScore < oppScore) {
          result = "L";
        } else {
          result = "D";
        }
      }
      teams[code].fixtures.push({
        dateTs: date ? Date.parse(date) : 0,
        date,
        round,
        opponent: oppName,
        venue,
        status,
        myScore,
        oppScore,
        result,
        home: isHome,
      });
    };

    push(homeCode, true);
    push(awayCode, false);
  }

  for (const team of Object.values(teams)) {
    if (!team.fixtures) continue;
    team.fixtures.sort((a, b) => a.dateTs - b.dateTs);
  }
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

function attachGroupStandings(teams, fixtures) {
  // Group-stage matches are tagged like "Group Stage - 1/2/3" in the round
  // field. No explicit group letter, but two teams are in the same group iff
  // they meet during group stage.
  const groupMatches = (fixtures?.response ?? []).filter((m) => /group stage/i.test(m.league?.round || ""));

  const teamMates = new Map(); // teamName -> Set of opponents seen in group stage
  for (const m of groupMatches) {
    const home = m.teams?.home?.name;
    const away = m.teams?.away?.name;
    if (!home || !away) continue;
    if (!teamMates.has(home)) teamMates.set(home, new Set());
    if (!teamMates.has(away)) teamMates.set(away, new Set());
    teamMates.get(home).add(away);
    teamMates.get(away).add(home);
  }

  const groupOf = (name) => {
    const mates = teamMates.get(name);
    if (!mates) return null;
    return [name, ...mates];
  };

  for (const team of Object.values(teams)) {
    if (!team.name) continue;
    const members = groupOf(team.name);
    if (!members || members.length < 2) continue;

    const stats = {};
    for (const n of members) stats[n] = { name: n, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0 };

    for (const m of groupMatches) {
      const h = m.teams?.home?.name;
      const a = m.teams?.away?.name;
      if (!stats[h] || !stats[a]) continue;
      const status = m.fixture?.status?.short;
      if (!["FT", "AET", "PEN"].includes(status)) continue;
      const hg = m.goals?.home ?? 0;
      const ag = m.goals?.away ?? 0;

      stats[h].played += 1; stats[a].played += 1;
      stats[h].gf += hg;   stats[h].ga += ag;
      stats[a].gf += ag;   stats[a].ga += hg;

      if (hg > ag) {
        stats[h].wins += 1; stats[h].pts += 3;
        stats[a].losses += 1;
      } else if (hg < ag) {
        stats[a].wins += 1; stats[a].pts += 3;
        stats[h].losses += 1;
      } else {
        stats[h].draws += 1; stats[h].pts += 1;
        stats[a].draws += 1; stats[a].pts += 1;
      }
    }

    const table = Object.values(stats)
      .map((s) => ({ ...s, gd: s.gf - s.ga }))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name))
      .map((row, idx) => ({ ...row, position: idx + 1 }));

    team.groupTable = table;
  }
}

function attachTeamStage(teams, bracket) {
  // Mark each team's current stage so the panel can show "Round of 16" /
  // "Eliminated · Round of 32" without recomputing from fixtures client-side.
  const stageOrder = ["R32", "R16", "QF", "SF", "F"];
  const stageLabel = { R32: "Round of 32", R16: "Round of 16", QF: "Quarter-final", SF: "Semi-final", F: "Final" };
  for (const round of bracket.rounds) {
    if (!stageOrder.includes(round.key)) continue;
    for (const match of round.matches) {
      for (const side of ["home", "away"]) {
        const code = match[side].code;
        if (!code || !teams[code]) continue;
        const team = teams[code];
        // Only overwrite with a later stage; never downgrade.
        const currentRank = team.stageRank ?? -1;
        const newRank = stageOrder.indexOf(round.key);
        if (newRank > currentRank) {
          team.stage = stageLabel[round.key];
          team.stageKey = round.key;
          team.stageRank = newRank;
        }
      }
    }
  }
}

function resolveCode(team) {
  if (!team) return null;
  // Prefer FIFA 3-letter code when API-Football emits one of ours.
  if (team.code && KNOWN_CODES.has(team.code.toUpperCase())) {
    return team.code.toUpperCase();
  }
  // Otherwise look up by normalized name. Strip diacritics + lowercase.
  const name = (team.name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  if (NAME_TO_CODE[name]) return NAME_TO_CODE[name];
  // Fall back: try collapsing punctuation / "the".
  const simplified = name.replace(/[^a-z]+/g, " ").replace(/\bthe\b/g, "").trim();
  if (NAME_TO_CODE[simplified]) return NAME_TO_CODE[simplified];
  return null;
}

function scoreString(match, side) {
  const home = match.goals?.home;
  const away = match.goals?.away;
  if (home == null || away == null) return null;
  return side === "home" ? `${home}-${away}` : `${away}-${home}`;
}

async function apiFootball(apiKey, path, params) {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
      "Accept": "application/json",
    },
    // Cache upstream calls at Cloudflare's edge for a short window so two
    // near-simultaneous snapshot rebuilds don't double-bill our quota.
    cf: { cacheTtl: 60, cacheEverything: true },
  });

  if (!response.ok) {
    throw new Error(`API-Football ${path} ${response.status}`);
  }
  const body = await response.json();

  // API-Football returns HTTP 200 even on rate-limit / plan errors. Surface
  // those so buildSnapshot fails loudly instead of returning empty data.
  const errors = body?.errors;
  const hasErrors = errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0);
  if (hasErrors) {
    const msg = JSON.stringify(errors);
    throw new Error(`API-Football ${path} responded with errors: ${msg}`);
  }

  console.log(`api ${path} → results=${body?.results ?? "?"}`);
  return body;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function withClientHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  // Force-replace the edge-friendly Cache-Control with a browser-safe one.
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
