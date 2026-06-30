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
const SNAPSHOT_CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_VERSION = "v2"; // Bump whenever the snapshot shape changes.

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
    return jsonResponse({ error: "Upstream fetch failed", detail: String(err) }, 502);
  }

  // The response we stash in the edge cache uses a long Cache-Control so
  // the Cache API honors our TTL. The response we return to the browser
  // uses no-store so clients never disk-cache a stale snapshot.
  const cacheBody = JSON.stringify(snapshot);
  const cacheable = new Response(cacheBody, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${SNAPSHOT_CACHE_TTL_SECONDS}`,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, cacheable));

  return jsonResponse(snapshot, 200, {
    "Cache-Control": "no-store",
  });
}

async function buildSnapshot(apiKey, season) {
  const [standings, fixtures, scorers] = await Promise.all([
    apiFootball(apiKey, "/standings", { league: LEAGUE_ID, season }),
    apiFootball(apiKey, "/fixtures", { league: LEAGUE_ID, season }),
    apiFootball(apiKey, "/players/topscorers", { league: LEAGUE_ID, season }),
  ]);

  const teams = collectTeams(standings, fixtures);
  attachStandings(teams, standings);
  attachNextFixtures(teams, fixtures);
  attachTopScorers(teams, scorers);

  return {
    generatedAt: new Date().toISOString(),
    season,
    leagueId: LEAGUE_ID,
    teams,
  };
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
    teams[code].topScorer = {
      name: row.player?.name,
      goals,
    };
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
  return response.json();
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
