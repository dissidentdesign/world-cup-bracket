# world-cup-bracket-api

Cloudflare Worker that proxies [API-Football](https://www.api-football.com/) and returns a single normalized snapshot the bracket UI consumes.

## Endpoints

- `GET /api/snapshot?season=2026` — fixtures, standings, top scorers, merged by 3-letter team code. Cached at the edge for 5 minutes.
- `GET /api/health` — `{ ok: true }`.

## One-time setup

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put API_FOOTBALL_KEY   # paste your api-sports.io key
```

Get a key at <https://dashboard.api-football.com/> — the free plan is 100 requests/day, which is enough thanks to the edge cache (one upstream refresh every ~5 minutes ≈ 36 calls/hour × 3 endpoints, served to unlimited clients).

## Deploy

```bash
npm run deploy
```

Wrangler prints a URL like `https://world-cup-bracket-api.<your-subdomain>.workers.dev`. Put that into `index.html` as the `data-api-base` attribute on `<body>`:

```html
<body data-api-base="https://world-cup-bracket-api.<your-subdomain>.workers.dev">
```

## Local dev

```bash
npm run dev   # serves on http://127.0.0.1:8787
```

For the frontend to talk to it locally, point `data-api-base` at the local URL, or just leave it blank and the app will keep using its seeded data.

## Tail logs

```bash
npm run tail
```
