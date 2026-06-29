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
  startAngle: 6,
  teamRadius: 452,
  leafStemRadius: 410,
  railRadii: [365, 286, 218, 154],
  roundRadii: [330, 250, 178, 118],
};

const layoutTeams = teams.map((item, index) => ({
  ...item,
  slot: index,
  angle: geometry.startAngle + (360 / teams.length) * index,
}));

const teamById = new Map(layoutTeams.map((item) => [item.id, item]));

const linesSvg = document.querySelector("#bracket-lines");
const teamLayer = document.querySelector("#team-layer");
const labelsLayer = document.querySelector("#round-labels");
const panel = document.querySelector("#team-panel");
let selectedId = "usa";

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
    watch: [
      ["TV", "FOX / FS1"],
      ["Spanish", "Telemundo / Universo"],
      ["Streaming", "Fox Sports app, Peacock"],
    ],
  };
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
}

function renderTeamNodes() {
  layoutTeams.forEach((item) => {
    const point = teamPosition(item);
    const node = document.createElement("button");
    node.type = "button";
    node.className = "team-node";
    node.style.left = `${point.x / 10}%`;
    node.style.top = `${point.y / 10}%`;
    node.style.setProperty("--team-color", item.color);
    node.dataset.team = item.id;
    node.setAttribute("aria-label", `Open ${item.name} details`);
    node.innerHTML = flagMarkup(item);
    node.addEventListener("click", () => selectTeam(item.id));
    teamLayer.appendChild(node);
  });
}

function flagMarkup(item) {
  return `
    <span class="flag" aria-hidden="true">${item.flag}</span>
  `;
}

function renderConnectors() {
  for (let roundIndex = 0; roundIndex < geometry.roundRadii.length; roundIndex += 1) {
    const groupCount = 16 / 2 ** roundIndex;
    const childRadius = roundIndex === 0 ? geometry.leafStemRadius : geometry.roundRadii[roundIndex - 1];
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
    const semi = roundPoint(3, sideIndex);
    const finalEdge = {
      x: geometry.center + (semi.x < geometry.center ? -30 : 30),
      y: geometry.center + (sideIndex === 0 ? -14 : 14),
    };
    addPath(linePath(semi, finalEdge));
  }

}

function addPath(d) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", "line-path");
  linesSvg.appendChild(path);
}

function selectTeam(id) {
  selectedId = id;
  renderTeamPanel(teamById.get(id));
}

function renderTeamPanel(item) {
  panel.innerHTML = `
    <article class="team-card">
      <div class="team-hero">
        <div class="team-badge" style="--team-color: ${item.color}">
          <span class="flag" aria-hidden="true">${item.flag}</span>
        </div>
        <div>
          <h2>${item.name}</h2>
          <div class="team-meta">${item.confederation} · FIFA rank ${item.fifaRank} · Seed ${item.seed}</div>
        </div>
      </div>

      <div class="chip-row" aria-label="Team form and key player">
        <span class="chip">Form ${item.form}</span>
        <span class="chip">Key player ${item.player}</span>
      </div>

      <section>
        <h3 class="section-title">Current Stats</h3>
        <div class="stat-grid">
          <div class="stat"><strong>${item.goalsFor}</strong><span>Goals for</span></div>
          <div class="stat"><strong>${item.goalsAgainst}</strong><span>Goals against</span></div>
          <div class="stat"><strong>${item.possession}</strong><span>Average possession</span></div>
          <div class="stat"><strong>${item.xg}</strong><span>Expected goals</span></div>
        </div>
      </section>

      <section>
        <h3 class="section-title">Next Game</h3>
        <div class="match-card">
          <div class="match-row">
            <span class="opponent">vs ${item.opponent}</span>
            <span>${item.date}</span>
          </div>
          <span>${item.venue}</span>
        </div>
      </section>

      <section>
        <h3 class="section-title">Where To Watch</h3>
        <ul class="watch-list">
          ${item.watch.map(([label, value]) => `<li><strong>${label}</strong><span>${value}</span></li>`).join("")}
        </ul>
      </section>

      <p class="source-note">
        All bracket nodes use country flags only. Match data is seeded until a licensed fixture/stat/watch provider is connected.
      </p>
    </article>
  `;
}

renderBracket();
renderTeamPanel(teamById.get(selectedId));
