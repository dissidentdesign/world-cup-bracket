# World Cup Bracket

A static prototype for a rounded World Cup knockout bracket inspired by the attached reference image, with country flags arranged around a clean central final matchup.

## Run

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## What is included

- Rounded 32-team knockout layout with outer team nodes and inner round junctions that converge on the final.
- Country flags on every team node.
- Clickable teams that open a detail panel.
- Seeded team data for stats, form, next game, venue, and U.S. viewing options.
- Responsive layout that moves the team panel below the bracket on smaller screens.

## Live data

The bracket layout is driven by the seeded `teams` array in `app.js`. When a Cloudflare Worker URL is set on `<body data-api-base="…">`, the app calls `GET /api/snapshot` on that worker and merges live fixtures, standings, form, and top scorers into the team detail panel.

To enable it:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put API_FOOTBALL_KEY   # paste your api-sports.io key
npm run deploy
```

Take the printed URL and put it on the body tag:

```html
<body data-api-base="https://world-cup-bracket-api.<your-subdomain>.workers.dev">
```

Reload — you'll see a "Live" pill in the header. The worker hides the API key, caches the snapshot at the edge for 5 minutes, and returns a single JSON blob keyed by FIFA 3-letter code, so the app makes one network call per page load regardless of how many users hit it. See `worker/README.md` for details.

### What the free tier covers
- Fixtures, standings (W-D-L, goals, points, form), and top scorers.
- API-Football's free tier is 100 requests/day; the 5-minute edge cache keeps us well inside that.

### What still needs a paid feed
- Per-match possession / xG (API-Football has it under fixture statistics; the free tier rate budget makes 32-team aggregation impractical).
- FIFA world rankings (no public API — currently kept seeded).
- Broadcast listings (licensed; the seeded FOX/Telemundo/Peacock values cover the US rightsholders through 2026).
