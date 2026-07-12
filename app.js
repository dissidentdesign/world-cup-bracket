const teams = [
  team("usa", "United States", "USA", "🇺🇸", "#243d7c", "A1", "CONCACAF", "Christian Pulisic", "Mexico", 11, "W-D-W-L-W"),
  team("mex", "Mexico", "MEX", "🇲🇽", "#166c45", "A2", "CONCACAF", "Santiago Gimenez", "United States", 15, "W-W-D-L-W"),
  team("arg", "Argentina", "ARG", "🇦🇷", "#5aa4d8", "B1", "CONMEBOL", "Lionel Messi", "Germany", 1, "W-W-W-D-W"),
  team("ger", "Germany", "GER", "🇩🇪", "#282521", "B2", "UEFA", "Jamal Musiala", "Argentina", 10, "D-W-W-L-W"),
  team("esp", "Spain", "ESP", "🇪🇸", "#b92b2f", "C1", "UEFA", "Lamine Yamal", "Portugal", 3, "W-W-W-D-W"),
  team("por", "Portugal", "POR", "🇵🇹", "#1f7d43", "C2", "UEFA", "Bruno Fernandes", "Spain", 6, "W-L-W-D-W"),
  team("fra", "France", "FRA", "🇫🇷", "#244d91", "D1", "UEFA", "Kylian Mbappe", "Senegal", 2, "W-D-W-W-W"),
  team("sen", "Senegal", "SEN", "🇸🇳", "#299260", "D2", "CAF", "Sadio Mane", "France", 17, "D-W-W-L-W"),
  team("bra", "Brazil", "BRA", "🇧🇷", "#209750", "E1", "CONMEBOL", "Vinicius Junior", "Canada", 5, "W-L-W-W-D"),
  team("can", "Canada", "CAN", "🇨🇦", "#b61d2a", "E2", "CONCACAF", "Alphonso Davies", "Brazil", 31, "D-W-L-W-D"),
  team("eng", "England", "ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "#d8dce9", "F1", "UEFA", "Harry Kane", "Japan", 4, "W-W-D-W-L"),
  team("jpn", "Japan", "JPN", "🇯🇵", "#f3f3f0", "F2", "AFC", "Takefusa Kubo", "England", 18, "W-W-D-W-L"),
  team("ned", "Netherlands", "NED", "🇳🇱", "#e1792f", "G1", "UEFA", "Cody Gakpo", "Morocco", 7, "D-W-W-D-L"),
  team("mar", "Morocco", "MAR", "🇲🇦", "#b51f33", "G2", "CAF", "Achraf Hakimi", "Netherlands", 12, "W-W-L-D-W"),
  team("col", "Colombia", "COL", "🇨🇴", "#d7bd30", "H1", "CONMEBOL", "Luis Diaz", "Belgium", 9, "W-W-D-D-W"),
  team("bel", "Belgium", "BEL", "🇧🇪", "#d0a42e", "H2", "UEFA", "Kevin De Bruyne", "Colombia", 8, "W-D-L-W-D"),
  team("uru", "Uruguay", "URU", "🇺🇾", "#78bfe3", "I1", "CONMEBOL", "Federico Valverde", "Australia", 14, "W-D-W-L-D"),
  team("aus", "Australia", "AUS", "🇦🇺", "#1f6b50", "I2", "AFC", "Mathew Ryan", "Uruguay", 24, "W-L-D-W-D"),
  team("sui", "Switzerland", "SUI", "🇨🇭", "#d43c3c", "J1", "UEFA", "Granit Xhaka", "Korea Republic", 19, "D-W-D-W-L"),
  team("kor", "Korea Republic", "KOR", "🇰🇷", "#cf3347", "J2", "AFC", "Son Heung-min", "Switzerland", 22, "L-W-W-D-W"),
  team("cro", "Croatia", "CRO", "🇭🇷", "#d64040", "K1", "UEFA", "Luka Modric", "Poland", 13, "W-D-L-W-W"),
  team("pol", "Poland", "POL", "🇵🇱", "#d72d36", "K2", "UEFA", "Robert Lewandowski", "Croatia", 28, "L-W-D-W-L"),
  team("den", "Denmark", "DEN", "🇩🇰", "#c72532", "L1", "UEFA", "Christian Eriksen", "Nigeria", 21, "D-W-W-L-D"),
  team("nga", "Nigeria", "NGA", "🇳🇬", "#198754", "L2", "CAF", "Victor Osimhen", "Denmark", 30, "W-L-W-D-W"),
  team("ecu", "Ecuador", "ECU", "🇪🇨", "#dfbd32", "M1", "CONMEBOL", "Moises Caicedo", "Ghana", 23, "D-W-W-D-L"),
  team("gha", "Ghana", "GHA", "🇬🇭", "#248c4d", "M2", "CAF", "Mohammed Kudus", "Ecuador", 41, "W-D-L-W-D"),
  team("egy", "Egypt", "EGY", "🇪🇬", "#c6343f", "N1", "CAF", "Mohamed Salah", "Algeria", 32, "W-W-D-L-W"),
  team("alg", "Algeria", "ALG", "🇩🇿", "#1d8c55", "N2", "CAF", "Riyad Mahrez", "Egypt", 36, "D-W-L-W-W"),
  team("swe", "Sweden", "SWE", "🇸🇪", "#276aa5", "O1", "UEFA", "Alexander Isak", "Norway", 27, "W-L-D-W-D"),
  team("nor", "Norway", "NOR", "🇳🇴", "#bb2e3a", "O2", "UEFA", "Erling Haaland", "Sweden", 29, "W-W-L-D-W"),
  team("qat", "Qatar", "QAT", "🇶🇦", "#7d1230", "P1", "AFC", "Akram Afif", "Saudi Arabia", 35, "D-W-W-D-L"),
  team("ksa", "Saudi Arabia", "KSA", "🇸🇦", "#177245", "P2", "AFC", "Salem Al-Dawsari", "Qatar", 34, "W-L-D-W-L"),
];

const geometry = {
  size: 1000,
  center: 500,
  // Rotate the complete bracket counter-clockwise so the semifinal-to-final
  // spokes settle onto a clean horizontal axis.
  startAngle: -39.375,
  teamRadius: 452,
  leafStemRadius: 410,
  railRadii: [365, 286, 218, 154],
  roundRadii: [330, 250, 178, 118],
};

// Official WC2026 R32 bracket positions, clockwise from the top. Each entry
// is the matchup at that slot; the first team sits at the lower slot index
// (earlier clockwise position). Matched by FIFA 3-letter code so the lookup
// is stable regardless of upstream naming (ESPN uses "Bosnia-Herzegovina",
// "United States", etc. — codes let us ignore those differences).
const BRACKET_POSITION = [
  ["FRA", "SWE"],
  ["GER", "PAR"],
  ["BRA", "JPN"],
  ["CIV", "NOR"],
  ["MEX", "ECU"],
  ["ENG", "COD"],
  ["ARG", "CPV"],
  ["AUS", "EGY"],
  ["SUI", "ALG"],
  ["COL", "GHA"],
  ["BEL", "SEN"],
  ["USA", "BIH"],
  ["AUT", "ESP"],
  ["CRO", "POR"],
  ["MAR", "NED"],
  ["RSA", "CAN"],
];

const seededByCode = new Map(teams.map((item) => [item.code, item]));

const CODE_TO_ISO = {
  USA: "US", MEX: "MX", ARG: "AR", GER: "DE", ESP: "ES", POR: "PT",
  FRA: "FR", SEN: "SN", BRA: "BR", CAN: "CA", ENG: "GB", JPN: "JP",
  NED: "NL", MAR: "MA", COL: "CO", BEL: "BE", URU: "UY", AUS: "AU",
  SUI: "CH", KOR: "KR", CRO: "HR", POL: "PL", DEN: "DK", NGA: "NG",
  ECU: "EC", GHA: "GH", EGY: "EG", ALG: "DZ", SWE: "SE", NOR: "NO",
  QAT: "QA", KSA: "SA", PAR: "PY", CIV: "CI", COD: "CD", CPV: "CV",
  BIH: "BA", AUT: "AT", RSA: "ZA",
};

// Country-name → flag emoji for WC2026 teams that aren't in the seed list.
// Only needed for placeholders; seeded teams already carry their flag.
const NAME_TO_FLAG = {
  "Türkiye": "🇹🇷", "Turkey": "🇹🇷",
  "Bosnia & Herzegovina": "🇧🇦", "Bosnia and Herzegovina": "🇧🇦",
  "Cape Verde Islands": "🇨🇻", "Cape Verde": "🇨🇻",
  "Jordan": "🇯🇴",
  "South Africa": "🇿🇦",
  "Paraguay": "🇵🇾",
  "Ivory Coast": "🇨🇮", "Côte d'Ivoire": "🇨🇮",
  "Iran": "🇮🇷",
  "Tunisia": "🇹🇳",
  "Mali": "🇲🇱",
  "Costa Rica": "🇨🇷",
  "Panama": "🇵🇦",
  "Curaçao": "🇨🇼",
  "Haiti": "🇭🇹",
  "Jamaica": "🇯🇲",
  "Honduras": "🇭🇳",
  "New Zealand": "🇳🇿",
  "Uzbekistan": "🇺🇿",
  "Iraq": "🇮🇶",
  "Austria": "🇦🇹",
  "Cameroon": "🇨🇲",
  "DR Congo": "🇨🇩", "Democratic Republic of Congo": "🇨🇩", "Congo DR": "🇨🇩",
  "Bolivia": "🇧🇴",
  "Peru": "🇵🇪",
  "Chile": "🇨🇱",
  "Venezuela": "🇻🇪",
  "Hungary": "🇭🇺",
  "Czech Republic": "🇨🇿", "Czechia": "🇨🇿",
  "Serbia": "🇷🇸",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Republic of Ireland": "🇮🇪", "Ireland": "🇮🇪",
};

let layoutTeams = buildInitialLayout();

let teamById = new Map(layoutTeams.map((item) => [item.id, item]));

const linesSvg = document.querySelector("#bracket-lines");
const teamLayer = document.querySelector("#team-layer");
const labelsLayer = document.querySelector("#round-labels");
const panel = document.querySelector("#team-panel");
let selectedId = "usa";
let latestBracket = null;

function team(id, name, code, flag, color, seed, confederation, player, opponent, rank, form) {
  return {
    id,
    name,
    code,
    flag,
    color,
    seed,
    confederation,
    form,
    fifaRank: rank,
    goalsFor: seededStat(id, 4, 11),
    goalsAgainst: seededStat(`${id}-ga`, 2, 7),
    possession: `${seededStat(`${id}-pos`, 43, 63)}%`,
    xg: (seededStat(`${id}-xg`, 38, 91) / 10).toFixed(1),
    player,
    opponent,
    date: "Next fixture TBD",
    venue: "Tournament venue TBD",
    live: null,
  };
}

function buildInitialLayout() {
  const totalSlots = BRACKET_POSITION.length * 2;
  return BRACKET_POSITION.flatMap(([homeCode, awayCode], position) => {
    const match = {
      home: initialSide(homeCode),
      away: initialSide(awayCode),
      date: null,
      venue: null,
      status: "Scheduled",
      displayClock: null,
      live: false,
      winner: null,
    };
    return [
      buildLeaf(match, "home", position * 2, totalSlots),
      buildLeaf(match, "away", position * 2 + 1, totalSlots),
    ];
  });
}

function initialSide(code) {
  const seeded = seededByCode.get(code);
  if (seeded) return { code, name: seeded.name, logo: null, score: null };
  return { code, name: code, logo: null, score: null };
}

function seededStat(seed, min, max) {
  const value = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return min + (value % (max - min + 1));
}

function polarPoint(angle, radius) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: geometry.center + Math.cos(radians) * radius,
    y: geometry.center + Math.sin(radians) * radius,
    angle,
    radius,
  };
}

function teamPosition(item) {
  return polarPoint(item.angle, geometry.teamRadius);
}

function roundPoint(roundIndex, index) {
  const groupSize = 2 ** (roundIndex + 1);
  const middleSlot = index * groupSize + (groupSize - 1) / 2;
  const angle = slotAngle(middleSlot);
  return polarPoint(angle, geometry.roundRadii[roundIndex]);
}

function finalPosition() {
  return { x: geometry.center, y: geometry.center, angle: 0, radius: 0 };
}

function slotAngle(slot) {
  return geometry.startAngle + (360 / teams.length) * slot;
}

function groupAngle(roundIndex, index) {
  const groupSize = 2 ** (roundIndex + 1);
  return slotAngle(index * groupSize + (groupSize - 1) / 2);
}

function groupChildAngles(roundIndex, index) {
  if (roundIndex === 0) {
    return [slotAngle(index * 2), slotAngle(index * 2 + 1)];
  }

  return [groupAngle(roundIndex - 1, index * 2), groupAngle(roundIndex - 1, index * 2 + 1)];
}

function linePath(...points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function curvedRailPath(left, right, parentAngle, railRadius) {
  const control = polarPoint(parentAngle, railRadius + 16);
  return `M ${left.x} ${left.y} Q ${control.x} ${control.y} ${right.x} ${right.y}`;
}

function curvedRailSegmentPath(left, right, parentAngle, railRadius, segment) {
  const control = polarPoint(parentAngle, railRadius + 16);
  const middle = curvePointAt(left, right, parentAngle, railRadius, 0.5);
  const segmentControl = segment === 0
    ? midpointPoint(left, control)
    : midpointPoint(control, right);
  const from = segment === 0 ? left : middle;
  const to = segment === 0 ? middle : right;
  return `M ${from.x} ${from.y} Q ${segmentControl.x} ${segmentControl.y} ${to.x} ${to.y}`;
}

function midpointPoint(left, right) {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

function curvePointAt(left, right, parentAngle, railRadius, t) {
  const control = polarPoint(parentAngle, railRadius + 16);
  const inverse = 1 - t;
  return {
    x: inverse ** 2 * left.x + 2 * inverse * t * control.x + t ** 2 * right.x,
    y: inverse ** 2 * left.y + 2 * inverse * t * control.y + t ** 2 * right.y,
  };
}

function renderBracket() {
  linesSvg.innerHTML = "";
  teamLayer.innerHTML = "";
  labelsLayer.innerHTML = "";
  linesSvg.setAttribute("viewBox", `0 0 ${geometry.size} ${geometry.size}`);

  renderConnectors();
  renderTeamNodes();
  renderAdvancement();
}

function renderAdvancement() {
  const itemByCode = new Map(layoutTeams.map((item) => [item.code, item]));
  for (const entry of buildBracketTopology()) {
    if (!entry.match.winner || !entry.point) continue;
    const winnerSide = entry.match.winner === "home" ? entry.match.home : entry.match.away;
    const winner = itemByCode.get(winnerSide?.code);
    if (winner) renderAdvanceNode(winner, entry.point, entry.roundIndex, entry.round.name);
  }
}

function renderAdvanceNode(winner, point, roundIndex, roundName = "knockout round") {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `advance-node advance-node-r${roundIndex}`;
    node.style.left = `${point.x / 10}%`;
    node.style.top = `${point.y / 10}%`;
    node.style.setProperty("--team-color", winner.color);
    node.dataset.team = winner.id;
    node.setAttribute("aria-label", `${winner.name} won ${roundName}`);
    node.innerHTML = flagMarkup(winner);
    node.addEventListener("click", () => selectTeam(winner.id));
    teamLayer.appendChild(node);
}

function renderTeamNodes() {
  layoutTeams.forEach((item) => {
    const point = teamPosition(item);
    const node = document.createElement("button");
    node.type = "button";
    const isLiveMatch = item.bracketMatch?.isLive === true;
    const classes = ["team-node"];
    if (item.eliminated) classes.push("is-eliminated");
    if (item.advanced) classes.push("is-advanced");
    if (isLiveMatch) classes.push("is-live");
    if (item.id === selectedId) classes.push("is-selected");
    node.className = classes.join(" ");
    node.style.left = `${point.x / 10}%`;
    node.style.top = `${point.y / 10}%`;
    node.style.setProperty("--team-color", item.color);
    node.dataset.team = item.id;
    const labelSuffix = isLiveMatch
      ? ` (live · ${item.bracketMatch?.displayClock || ""})`
      : item.eliminated ? " (eliminated)"
      : item.advanced ? " (advanced)" : "";
    node.setAttribute("aria-label", `Open ${item.name} details${labelSuffix}`);
    node.innerHTML = flagMarkup(item);
    node.addEventListener("click", () => selectTeam(item.id));
    teamLayer.appendChild(node);
  });
}

function flagMarkup(item) {
  const slug = flagSlug(item.flag);
  if (slug) {
    return `<span class="flag flag-img" aria-hidden="true" style="background-image:url('https://flagcdn.com/w160/${slug}.png')"></span>`;
  }
  if (item.apiLogo) {
    return `<span class="flag flag-img" aria-hidden="true" style="background-image:url('${item.apiLogo}')"></span>`;
  }
  return `<span class="flag" aria-hidden="true">${item.flag || "🏳️"}</span>`;
}

// Convert a flag emoji into the slug flagcdn.com expects (lowercase 2-letter
// ISO, or "gb-eng"/"gb-sct"/"gb-wls" for the home-nation tag sequences).
function flagSlug(emoji) {
  if (!emoji) return null;
  if (emoji === "🏴󠁧󠁢󠁥󠁮󠁧󠁿") return "gb-eng";
  if (emoji === "🏴󠁧󠁢󠁳󠁣󠁴󠁿") return "gb-sct";
  if (emoji === "🏴󠁧󠁢󠁷󠁬󠁳󠁿") return "gb-wls";
  const chars = [...emoji];
  if (chars.length !== 2) return null;
  const base = 0x1f1e6;
  const points = chars.map((c) => c.codePointAt(0));
  if (points.some((p) => p < base || p > base + 25)) return null;
  return String.fromCharCode(65 + (points[0] - base), 65 + (points[1] - base)).toLowerCase();
}

function renderConnectors() {
  const topology = buildBracketTopology();
  if (topology.length > 0) {
    topology.forEach((entry) => {
      if (entry.sources.length !== 2) return;
      const railRadius = geometry.railRadii[entry.roundIndex];
      const leftRail = polarPoint(entry.sources[0].angle, railRadius);
      const rightRail = polarPoint(entry.sources[1].angle, railRadius);
      const railJoin = curvePointAt(leftRail, rightRail, entry.point.angle, railRadius, 0.5);
      const winnerCode = entry.match.winner === "home"
        ? entry.match.home?.code
        : entry.match.winner === "away" ? entry.match.away?.code : null;
      const winnerSource = entry.sources.findIndex((source) => source.code === winnerCode);
      const isActiveWinner = winnerCode && isActiveTeamCode(winnerCode);
      const sharedClass = isActiveWinner ? "line-path is-advanced" : "line-path";

      addPath(linePath(entry.sources[0], leftRail), winnerSource === 0 && isActiveWinner ? sharedClass : "line-path");
      addPath(linePath(entry.sources[1], rightRail), winnerSource === 1 && isActiveWinner ? sharedClass : "line-path");
      addPath(
        curvedRailSegmentPath(leftRail, rightRail, entry.point.angle, railRadius, 0),
        winnerSource === 0 && isActiveWinner ? sharedClass : "line-path",
      );
      addPath(
        curvedRailSegmentPath(leftRail, rightRail, entry.point.angle, railRadius, 1),
        winnerSource === 1 && isActiveWinner ? sharedClass : "line-path",
      );
      addPath(linePath(railJoin, entry.point), sharedClass);
    });
    renderFinalSpokes(topology);
    return;
  }

  renderFallbackConnectors();
}

function buildBracketTopology() {
  const roundIndexByKey = { R32: 0, R16: 1, QF: 2, SF: 3 };
  const rounds = latestBracket?.rounds || [];
  if (!rounds.length) return [];

  const sourceByCode = new Map(layoutTeams.map((item) => [item.code, teamPosition(item)]));
  const topology = [];
  let previousEntries = [];

  for (const round of rounds) {
    const roundIndex = roundIndexByKey[round.key];
    if (roundIndex == null) continue;

    const roundEntries = [];
    (round.matches || []).forEach((match, matchIndex) => {
      const sources = [match.home, match.away].map((side, sideIndex) => {
        const previous = previousEntries[matchIndex * 2 + sideIndex];
        const point = sourceByCode.get(side?.code) || previous?.point;
        return point ? { ...point, code: side?.code || previous?.code } : null;
      }).filter(Boolean);
      const angle = sources.length === 2
        ? midpointAngle(sources[0].angle, sources[1].angle)
        : groupAngle(roundIndex, matchIndex);
      const point = polarPoint(angle, geometry.roundRadii[roundIndex]);
      const entry = { round, roundIndex, match, matchIndex, sources, point };
      topology.push(entry);
      roundEntries.push(entry);

      if (match.winner) {
        const winner = match.winner === "home" ? match.home : match.away;
        if (winner?.code) sourceByCode.set(winner.code, point);
      }
    });
    previousEntries = roundEntries;
  }

  return topology;
}

function midpointAngle(left, right) {
  const delta = ((right - left + 540) % 360) - 180;
  return left + delta / 2;
}

function isActiveTeamCode(code) {
  return layoutTeams.some((item) => item.code === code && !item.eliminated);
}

function renderFinalSpokes(topology) {
  const semifinals = topology
    .filter((entry) => entry.roundIndex === 3)
    .sort((a, b) => a.point.x - b.point.x);
  if (semifinals.length !== 2) return;

  for (const entry of semifinals) {
    const side = entry.point.x < geometry.center ? -1 : 1;
    const finalTarget = {
      x: geometry.center + side * 18,
      y: geometry.center,
    };
    const winnerCode = entry.match.winner === "home"
      ? entry.match.home?.code
      : entry.match.winner === "away" ? entry.match.away?.code : null;
    const highlighted = winnerCode && isActiveTeamCode(winnerCode)
      ? "line-path is-advanced"
      : "line-path";
    addPath(linePath(entry.point, finalTarget), highlighted);
  }
}

function renderFallbackConnectors() {
  for (let roundIndex = 0; roundIndex < geometry.roundRadii.length; roundIndex += 1) {
    const groupCount = 16 / 2 ** roundIndex;
      // The first-round spokes must begin at the team bubble center so the
      // visible line reaches the bubble edge instead of stopping short.
      const childRadius = roundIndex === 0 ? geometry.teamRadius : geometry.roundRadii[roundIndex - 1];
    const railRadius = geometry.railRadii[roundIndex];
    const parentRadius = geometry.roundRadii[roundIndex];

    for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
      const [leftAngle, rightAngle] = groupChildAngles(roundIndex, groupIndex);
      const parentAngle = groupAngle(roundIndex, groupIndex);
      const leftOuter = polarPoint(leftAngle, childRadius);
      const leftRail = polarPoint(leftAngle, railRadius);
      const rightOuter = polarPoint(rightAngle, childRadius);
      const rightRail = polarPoint(rightAngle, railRadius);
      const railJoin = curvePointAt(leftRail, rightRail, parentAngle, railRadius, 0.5);
      const parent = polarPoint(parentAngle, parentRadius);

      addPath(linePath(leftOuter, leftRail));
      addPath(linePath(rightOuter, rightRail));
      addPath(curvedRailPath(leftRail, rightRail, parentAngle, railRadius));
      addPath(linePath(railJoin, parent));
    }
  }

  for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
    const semi = polarPoint(sideIndex === 0 ? 270 : 90, geometry.roundRadii[3]);
    const finalEdge = {
      x: geometry.center + (semi.x < geometry.center ? -18 : 18),
      y: geometry.center,
    };
    addPath(linePath(semi, finalEdge));
  }

}

function addPath(d, className = "line-path") {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", className);
  linesSvg.appendChild(path);
}

function selectTeam(id) {
  selectedId = id;
  teamLayer.querySelectorAll(".team-node").forEach((node) => {
    node.classList.toggle("is-selected", node.dataset.team === id);
  });
  renderTeamPanel(teamById.get(id));
}

function renderTeamPanel(item) {
  const live = item.live;
  const agg = live?.aggregateStats;
  const statGrid = agg && agg.played > 0
    ? `
      <div class="stat-grid">
        <div class="stat"><strong>${agg.played}</strong><span>Matches played</span></div>
        <div class="stat"><strong>${agg.wins}-${agg.draws}-${agg.losses}</strong><span>W-D-L</span></div>
        <div class="stat"><strong>${agg.gf}</strong><span>Goals for</span></div>
        <div class="stat"><strong>${agg.ga} (${agg.gd >= 0 ? "+" : ""}${agg.gd})</strong><span>Goals against (GD)</span></div>
      </div>
    `
    : `
      <div class="stat-grid">
        <div class="stat"><strong>${item.goalsFor}</strong><span>Goals for</span></div>
        <div class="stat"><strong>${item.goalsAgainst}</strong><span>Goals against</span></div>
        <div class="stat"><strong>${item.possession}</strong><span>Average possession</span></div>
        <div class="stat"><strong>${item.xg}</strong><span>Expected goals</span></div>
      </div>
    `;

  const chips = [];
  if (live?.topScorer?.name) {
    chips.push(`<span class="chip">⚽ ${live.topScorer.name} · ${live.topScorer.goals}g</span>`);
  } else if (item.player && item.player !== "—") {
    chips.push(`<span class="chip">⚽ ${item.player}</span>`);
  }
  if (live?.topAssister?.name) {
    chips.push(`<span class="chip">🅰️ ${live.topAssister.name} · ${live.topAssister.assists}a</span>`);
  }
  if (live?.form) {
    chips.push(`<span class="chip">Form ${insertDashes(live.form)}</span>`);
  }
  const chipRow = chips.length
    ? `<div class="chip-row" aria-label="Team highlights">${chips.join("")}</div>`
    : "";

  const groupLabel = live?.group
    ? `Group ${live.group.replace(/^Group\s+/i, "")}`
    : item.seed && item.seed !== "—" ? `Seed ${item.seed}` : "WC2026";

  const statusBadge = item.eliminated
    ? `<span class="status-badge is-out">Eliminated${item.eliminatedAt ? ` · ${item.eliminatedAt}` : ""}</span>`
    : item.advanced
      ? `<span class="status-badge is-in">Advanced · ${live?.stage ?? "next round"}</span>`
      : live?.stage
        ? `<span class="status-badge is-active">${live.stage}</span>`
        : "";

  const path = renderTournamentPath(live, item);

  const sourceNote = live
    ? `Live data via ESPN · refreshed ${formatRelative(live.generatedAt)}.`
    : "Match data is seeded. Connect the worker (set data-api-base on &lt;body&gt;) to show live fixtures.";

  panel.innerHTML = `
    <article class="team-card">
      <div class="team-hero">
        <div class="team-badge" style="--team-color: ${item.color}">
          ${flagMarkup(item)}
        </div>
        <div>
          <h2>${item.name}</h2>
          <div class="team-meta">${item.confederation} · FIFA rank ${item.fifaRank} · ${groupLabel}</div>
          ${statusBadge}
        </div>
      </div>

      ${chipRow}

      <section>
        <h3 class="section-title">Tournament Stats</h3>
        ${statGrid}
      </section>

      ${path}

      ${renderGroupRecap(item)}

      <p class="source-note">${sourceNote}</p>
    </article>
  `;
}

function renderTournamentPath(live, item) {
  const fixtures = live?.fixtures || [];
  if (fixtures.length === 0) {
    // Fall back to the bracketMatch (covers placeholder teams that didn't
    // resolve a code, so they're not in the global teams map).
    const bm = item.bracketMatch;
    if (!bm) return "";
    return `
      <section>
        <h3 class="section-title">Round of 32</h3>
        <ul class="path-list">
          ${pathRow({
            round: "Round of 32",
            opponent: bm.opponent,
            date: bm.date,
            venue: bm.venue,
            status: bm.status,
            myScore: bm.myScore,
            oppScore: bm.oppScore,
            result: bm.isCompleted ? (bm.isWinner ? "W" : "L") : null,
          })}
        </ul>
      </section>
    `;
  }
  return `
    <section>
      <h3 class="section-title">Tournament Path</h3>
      <ul class="path-list">
        ${fixtures.map((f) => pathRow(f)).join("")}
      </ul>
    </section>
  `;
}

function pathRow(f) {
  const isLive = f.live === true || f.statusState === "in";
  const result = f.result;
  let resultClass;
  let resultLabel;
  if (isLive) {
    resultClass = "is-live";
    resultLabel = "LIVE";
  } else if (result) {
    resultClass = result === "W" ? "is-win" : result === "L" ? "is-loss" : "is-draw";
    resultLabel = result;
  } else {
    resultClass = "is-upcoming";
    resultLabel = shortStatus(f.status);
  }
  const decidedBy = /pens/i.test(f.status || "") ? " (P)" : /aet/i.test(f.status || "") ? " (AET)" : "";
  const hasScore = f.myScore != null && f.oppScore != null;
  const scoreText = isLive && hasScore
    ? `${f.myScore}–${f.oppScore}`
    : hasScore && result
      ? `${f.myScore}–${f.oppScore}${decidedBy}`
      : "vs";
  const roundShort = shortRound(f.round);
  const dateText = isLive
    ? `⏱ ${f.displayClock || "LIVE"}`
    : f.date ? formatFixtureDate(f.date) : "";
  const venueText = f.venue || "";
  const metaParts = [dateText, venueText].filter(Boolean);
  const upcoming = !result && !isLive;
  const broadcasts = Array.isArray(f.broadcasts) ? f.broadcasts.filter(Boolean) : [];
  const watchLine = (upcoming || isLive) && broadcasts.length
    ? `<span class="path-watch">📺 ${broadcasts.join(" · ")}</span>`
    : "";
  return `
    <li class="path-row${isLive ? " is-live-row" : ""}">
      <span class="path-chip ${resultClass}" aria-label="Result ${resultLabel}">${resultLabel}</span>
      <span class="path-round">${roundShort}</span>
      <span class="path-score"><strong>${scoreText}</strong> ${f.opponent}</span>
      <span class="path-meta">${metaParts.join(" · ")}</span>
      ${watchLine}
    </li>
  `;
}

function shortStatus(s) {
  if (!s) return "—";
  if (/scheduled/i.test(s)) return "—";
  if (/full time|FT/i.test(s)) return "FT";
  if (/half/i.test(s)) return "HT";
  return s.length > 8 ? s.slice(0, 8) : s;
}

function renderGroupRecap(item) {
  const table = item.live?.groupTable;
  if (!table || table.length === 0) return "";
  const rows = table.map((row) => `
    <tr class="${row.name === item.name ? "is-self" : ""}">
      <td class="pos">${row.position}</td>
      <td class="team">${row.name}</td>
      <td>${row.played}</td>
      <td>${row.wins}</td>
      <td>${row.draws}</td>
      <td>${row.losses}</td>
      <td>${row.gd >= 0 ? "+" : ""}${row.gd}</td>
      <td class="pts">${row.pts}</td>
    </tr>
  `).join("");
  return `
    <section>
      <h3 class="section-title">Group Recap</h3>
      <table class="group-table">
        <thead>
          <tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function shortRound(round) {
  if (!round) return "";
  if (/group stage - 1/i.test(round)) return "G1";
  if (/group stage - 2/i.test(round)) return "G2";
  if (/group stage - 3/i.test(round)) return "G3";
  if (/round of 32/i.test(round)) return "R32";
  if (/round of 16/i.test(round)) return "R16";
  if (/quarter/i.test(round)) return "QF";
  if (/semi/i.test(round)) return "SF";
  if (/3rd|third/i.test(round)) return "3rd";
  if (/^final/i.test(round)) return "F";
  return round;
}

function insertDashes(form) {
  return form.replace(/[A-Z]/g, "$&-").replace(/-$/, "");
}

function formatFixtureDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatRelative(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  return date.toLocaleString();
}

let livePollHandle = null;
const TOURNAMENT_START_TS = Date.parse("2026-06-11T00:00:00Z");
const TOURNAMENT_END_TS = Date.parse("2026-07-20T06:00:00Z");

async function loadLiveData() {
  const apiBase = document.body.dataset.apiBase?.trim();
  if (!apiBase) return;

  setLiveStatus("connecting");

  try {
    const snapshotUrl = new URL(`${apiBase.replace(/\/$/, "")}/api/snapshot`);
    // During the tournament, bypass the Worker's edge cache so completed games
    // and bracket advancement do not sit stale for up to 15 minutes.
    if (isTournamentActiveWindow()) snapshotUrl.searchParams.set("refresh", "1");

    const response = await fetch(snapshotUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const snapshot = await response.json();
    applyBracketLayout(snapshot.bracket);
    latestBracket = snapshot.bracket || null;
    mergeSnapshot(snapshot);
    renderBracket();
    renderTeamPanel(teamById.get(selectedId));
    const liveCount = Array.isArray(snapshot.liveMatches) ? snapshot.liveMatches.length : 0;
    setLiveStatus(liveCount > 0 ? "live-match" : "live", snapshot.generatedAt, liveCount);
    scheduleLivePoll(snapshot.hasLive === true);
  } catch (err) {
    console.warn("Live data fetch failed; falling back to seeded values.", err);
    setLiveStatus("offline");
    // Retry in a minute so a transient blip doesn't strand the page.
    scheduleLivePoll(false, 60_000);
  }
}

function scheduleLivePoll(hasLive, delayMs) {
  if (livePollHandle) clearTimeout(livePollHandle);
  // Poll often during the tournament even if ESPN does not currently mark a
  // match as live. Final whistles and bracket advancement matter too.
  const delay = delayMs ?? (hasLive ? 30_000 : isTournamentActiveWindow() ? 60_000 : 300_000);
  livePollHandle = setTimeout(loadLiveData, delay);
}

function isTournamentActiveWindow() {
  const now = Date.now();
  return now >= TOURNAMENT_START_TS && now <= TOURNAMENT_END_TS;
}

function mergeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || !snapshot.teams) return;
  for (const item of layoutTeams) {
    const live = snapshot.teams[item.code];
    if (!live) continue;
    item.live = {
      generatedAt: snapshot.generatedAt,
      stats: live.stats,
      aggregateStats: live.aggregateStats,
      fixtures: live.fixtures,
      groupTable: live.groupTable,
      stage: live.stage,
      stageKey: live.stageKey,
      form: live.form,
      group: live.group,
      nextFixture: live.nextFixture,
      lastMatch: live.lastMatch,
      topScorer: live.topScorer,
      topAssister: live.topAssister,
    };
    if (live.eliminated) {
      item.eliminated = true;
      item.eliminatedAt = live.eliminatedAt;
      item.eliminatedBy = live.eliminatedBy;
    }
  }
}

function applyBracketLayout(bracket) {
  const r32 = bracket?.rounds?.find((r) => r.key === "R32");
  if (!r32 || r32.matches.length !== 16) return;

  const newLayout = [];
  const totalSlots = BRACKET_POSITION.length * 2;
  const missing = [];

  BRACKET_POSITION.forEach(([leftCode, rightCode], position) => {
    const match = r32.matches.find((m) => {
      const a = m.home?.code, b = m.away?.code;
      return (a === leftCode && b === rightCode) || (a === rightCode && b === leftCode);
    });
    if (!match) {
      missing.push(`${leftCode} vs ${rightCode}`);
      return;
    }
    const leftSide = match.home?.code === leftCode ? "home" : "away";
    const rightSide = leftSide === "home" ? "away" : "home";
    newLayout.push(buildLeaf(match, leftSide, position * 2, totalSlots));
    newLayout.push(buildLeaf(match, rightSide, position * 2 + 1, totalSlots));
  });

  if (newLayout.length !== totalSlots) {
    console.warn("Bracket positions missing from API:", missing);
    return;
  }

  layoutTeams = newLayout;
  teamById = new Map(layoutTeams.map((item) => [item.id, item]));
  if (!teamById.has(selectedId)) {
    selectedId = layoutTeams[0].id;
  }
}

function buildLeaf(match, side, slot, totalSlots) {
  const mine = match[side];
  const other = match[side === "home" ? "away" : "home"];
  const seeded = mine.code ? seededByCode.get(mine.code) : null;
  const base = seeded ? { ...seeded } : placeholderTeam(mine);
  const angle = geometry.startAngle + (360 / totalSlots) * slot;

  // A resolved winner is the reliable "match completed" signal. Status
  // strings vary (FT, AET, FT-Pens, …) and a whitelist misses cases; if
  // ESPN has told us who advanced, treat the match as done.
  const isCompleted = !!match.winner;
  const isWinner = isCompleted && match.winner === side;
  const isLoser = isCompleted && match.winner !== side;
  const isLive = match.live === true || match.statusState === "in";

  return {
    ...base,
    slot,
    angle,
    bracketMatch: {
      opponent: other.name,
      opponentCode: other.code,
      opponentLogo: other.logo,
      venue: match.venue,
      date: match.date,
      status: match.status,
      displayClock: match.displayClock,
      isLive,
      myScore: mine.score,
      oppScore: other.score,
      isCompleted,
      isWinner,
    },
    eliminated: isLoser || base.eliminated || false,
    advanced: isWinner,
    apiLogo: mine.logo,
    // Note: don't set item.live here — that key holds the merged snapshot
    // object (stats/fixtures/…). Ask bracketMatch.isLive instead.
  };
}

function placeholderTeam(side) {
  const name = side.name || "Unknown";
  const code = side.code || (name.match(/[A-Z]/g)?.slice(0, 3).join("") || name.slice(0, 3)).toUpperCase();
  return {
    id: `unk-${(side.code || name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    name,
    code,
    flag: NAME_TO_FLAG[name] || flagEmojiFromCode(code) || "🏳️",
    color: "#2d3138",
    seed: "—",
    confederation: "—",
    fifaRank: "—",
    form: "—",
    goalsFor: "—",
    goalsAgainst: "—",
    possession: "—",
    xg: "—",
    player: "—",
    opponent: "TBD",
    date: "TBD",
    venue: "TBD",
    live: null,
  };
}

function flagEmojiFromCode(code) {
  const iso = CODE_TO_ISO[code];
  if (!iso || iso.length !== 2) return null;
  return [...iso].map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join("");
}

function setLiveStatus(state, generatedAt, liveCount = 0) {
  const dot = document.querySelector("#live-status");
  if (!dot) return;
  dot.dataset.state = state === "live-match" ? "live" : state;
  if (state === "live-match") dot.dataset.match = "on";
  else delete dot.dataset.match;
  const labels = {
    connecting: "Connecting…",
    live: generatedAt ? `Live · ${formatRelative(generatedAt)}` : "Live",
    "live-match": `⏱ ${liveCount} live · updates every 30s`,
    offline: "Seeded data",
  };
  dot.textContent = labels[state] ?? "";
}

renderBracket();
renderTeamPanel(teamById.get(selectedId));
loadLiveData();
