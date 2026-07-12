# World Cup Bracket

A single-page app that renders the FIFA World Cup 2026 knockout bracket as a rounded 32-team wheel and pulls live results, standings, and broadcasts from ESPN via a tiny Cloudflare Worker.

The repository also includes a native SwiftUI app in [`ios/`](ios/) for iPhone and iPad. Open `ios/WorldCupApp.xcodeproj` in Xcode and run the `WorldCupApp` scheme; it uses the same live snapshot API as the web client.

Live app: <https://world-cup-bracket.pages.dev/>
Source: <https://github.com/dissidentdesign/world-cup-bracket>

## What's in the box

**Bracket view**
- 32 outer flag circles laid out clockwise around a rounded knockout wheel; each pair converges through R16 → QF → SF to the final at center.
- Slot ordering follows the official WC2026 R32 pairings (see `BRACKET_POSITION` in [app.js](app.js) — 3-letter FIFA codes, edit-once source of truth).
- Live results drive visual state: winners get a green ring, eliminated teams are dimmed with a diagonal strike, and the selected team is outlined in gold.
- Small winner badges appear on the inner R16 ring as each R32 match completes; the tree fills upward automatically as the tournament progresses.

**Team panel**
- Header: flag, name, confederation, FIFA rank, group, and a status pill (`Round of 32`, `Advanced · Round of 16`, or `Eliminated · Round of 32`).
- Chip row (only when ESPN has data): top scorer, top assister, recent form.
- Tournament Stats grid: matches played, W-D-L, goals for, goals against + goal difference — aggregated across every match the team has played.
- Tournament Path: every WC match the team has played or has scheduled, ordered newest first. Each row shows a W/D/L chip, round tag (G1/G2/G3, R32, R16, …), score with `(P)` / `(AET)` annotation when relevant, kickoff time, venue, and a "Watch on" chip listing the real broadcasters for upcoming matches.
- Group Recap table: the four teams from the selected team's group with final standings, gold-highlighted for the selected row.

**Layout**
- Bracket sized to fit the viewport without page scrolling; only the side panel scrolls internally.
- Under 1160px the layout collapses to a single column with the bracket on top and the panel below.
- Flags are country flag images (from `flagcdn.com`, derived from emoji → ISO code) that fill each circle edge-to-edge. Placeholder teams outside the seeded list fall back to ESPN's team logo URL.

## Running it locally

The frontend is static — any HTTP server works.

```bash
python3 -m http.server 4173
```

Open <http://127.0.0.1:4173/>.

Out of the box, `<body data-api-base="…">` in `index.html` points at the deployed Cloudflare Worker, so a locally-served page still gets live data. Clear that attribute (`data-api-base=""`) to force fallback to the seeded data in `app.js`.

## Deploying the worker

Everything the app needs from ESPN is proxied by a Cloudflare Worker in [worker/](worker/). No API key or paid subscription is required — ESPN's public endpoints are unauthenticated.

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

Put the printed URL onto the body tag in `index.html`:

```html
<body data-api-base="https://world-cup-bracket-api.<your-subdomain>.workers.dev">
```

See [worker/README.md](worker/README.md) for endpoint details, cache behaviour, and dev commands.

## Architecture at a glance

```
Browser ─── GET /api/snapshot ──▶ Cloudflare Worker ──▶ ESPN scoreboard/standings/teams
   │                                     │
   │                                     └── 15-min edge cache + 24h stale-on-error copy
   │
   └── app.js merges snapshot on top of seeded 32-team layout
       and rebuilds the bracket per BRACKET_POSITION
```

- **Static frontend**: `index.html`, `styles.css`, `app.js`. Loads instantly with seeded values; a single `fetch` to `/api/snapshot` then enriches every team and rewires the bracket.
- **Worker**: `worker/src/index.js`. Three parallel ESPN calls, normalized into a single JSON blob keyed by 3-letter code, cached at the edge. Emits per-team fixtures, aggregate stats, group tables, elimination/advancement flags, and the full bracket tree.

## Data sources

- **Live tournament data** — [ESPN's public soccer endpoints](https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard). Scoreboard (all matches), standings (12 groups), teams (48-team roster with logos and colors). Powers everything the panel shows except FIFA world ranking.
- **Country flag images** — [flagcdn.com](https://flagcdn.com/), addressed by ISO-2 code derived from the seeded flag emoji.
- **Seeded data in `app.js`** — 32-team fallback list with hand-tuned colours, FIFA rank, and flag emoji. Only the FIFA rank and colour accents survive after ESPN loads; everything else is overwritten with live values.

## Configuration knobs

- **`BRACKET_POSITION`** in `app.js` — 16 pairs of 3-letter codes controlling clockwise slot order around the wheel. Edit to reorder the bracket layout.
- **`NAME_TO_FLAG`** in `app.js` — maps ESPN team names to flag emoji for teams not in the seeded 32 (Bosnia-Herzegovina, Cape Verde, Congo DR, etc.).
- **`SNAPSHOT_CACHE_TTL_SECONDS`** in `worker/src/index.js` — how long the edge caches a snapshot. 15 min by default.
- **`data-api-base`** on `<body>` in `index.html` — deployed Worker URL. Empty string = seeded-only mode.

## What isn't wired

- FIFA world rankings — no public feed, so the seeded values stay.
- Per-match possession / xG — not on ESPN's public scoreboard. Would need a paid feed.

## Repo

- Source: <https://github.com/dissidentdesign/world-cup-bracket>
