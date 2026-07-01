# world-cup-bracket-api

Cloudflare Worker that fetches ESPN's public soccer endpoints for the FIFA World Cup and returns a single normalized snapshot the bracket UI consumes. No API key required.

## Upstream

- `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=…` — every match in the tournament date range
- `https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings` — group standings
- `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams` — 48-team roster with logos and colors

These endpoints are public and used by espn.com itself — no auth, no documented rate limits. The worker still caches results at the edge for 15 minutes to keep upstream traffic light, and holds a 24h stale copy that's served if ESPN ever errors.

## Endpoints

- `GET /api/snapshot?season=2026` — normalized teams + bracket blob keyed by 3-letter team code.
- `GET /api/snapshot?refresh=1` — bypass the 15-minute edge cache (debug only).
- `GET /api/health` — `{ ok: true, upstream: "espn" }`.

## One-time setup

```bash
cd worker
npm install
npx wrangler login
```

No secrets to configure — the worker calls ESPN unauthenticated.

## Deploy

```bash
npm run deploy
```

Wrangler prints a URL like `https://world-cup-bracket-api.<your-subdomain>.workers.dev`. Put that on `<body data-api-base="…">` in `index.html`.

## Local dev

```bash
npm run dev   # serves on http://127.0.0.1:8787
```

## Tail logs

```bash
npm run tail
```
