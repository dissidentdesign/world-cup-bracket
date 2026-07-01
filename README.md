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

The bracket layout is driven by the seeded `teams` array in `app.js`. When a Cloudflare Worker URL is set on `<body data-api-base="…">`, the app calls `GET /api/snapshot` on that worker, which fetches ESPN's public soccer endpoints and returns a normalized blob keyed by FIFA 3-letter code. No API key or subscription needed.

To enable it:

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

Take the printed URL and put it on the body tag:

```html
<body data-api-base="https://world-cup-bracket-api.<your-subdomain>.workers.dev">
```

Reload — you'll see a "Live" pill in the header. The worker caches the snapshot at the edge for 15 minutes and keeps a 24h stale copy that's served if ESPN ever errors, so the app makes one network call per page load regardless of how many users hit it. See `worker/README.md` for details.

### What ships live from ESPN
- Full 48-team roster with logos, colors, group assignment.
- Every match (group stage through final): score, status, venue, kickoff time.
- Group standings (P/W/D/L/GF/GA/GD/Pts) with the advancement flag per team.
- Real broadcaster list per upcoming match (FOX, Telemundo, FOX One, etc.).
- Bracket structure — R32 → R16 → QF → SF → Final with winners auto-computed from results.

### What stays seeded
- FIFA world rankings (no public source).
- Team color accents (used behind flags in a few places; ESPN gives us `color` too but the seed values are hand-tuned).
