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

## Data note

The app currently uses provider-ready seeded match/stat data in `app.js`. To make it fully live, replace the `teams` array with a fixture/stat provider backed by sources such as FIFA, Opta, ESPN, or your preferred sports data API. Broadcast listings should also come from a licensed schedule provider because match assignments change by country, language, platform, and date.
