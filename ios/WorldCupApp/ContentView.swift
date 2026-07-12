import SwiftUI

private let apiURL = URL(string: "https://world-cup-bracket-api.dissidentdesign.workers.dev/api/snapshot")!

struct Snapshot: Decodable {
    let generatedAt: String?
    let hasLive: Bool?
    let teams: [String: Team]
    let bracket: Bracket?
}

struct Bracket: Decodable { let rounds: [BracketRound] }
struct BracketRound: Decodable, Identifiable {
    var id: String { key }
    let key: String
    let name: String
    let matches: [BracketMatch]
}
struct BracketMatch: Decodable, Identifiable {
    var id: String { eventId ?? "\(home.code ?? "tbd")-\(away.code ?? "tbd")" }
    let eventId: String?
    let home: BracketSide
    let away: BracketSide
    let winner: String?
    let live: Bool?
}
struct BracketSide: Decodable {
    let code: String?
    let name: String?
    let logo: String?
    let score: Int?
}

struct Team: Decodable, Identifiable {
    var id: String { code }
    let code: String
    let name: String
    let logo: String?
    let group: String?
    let confederation: String?
    let eliminated: Bool?
    let advanced: Bool?
    let stats: TeamStats?
    let fixtures: [Fixture]?

    enum CodingKeys: String, CodingKey {
        case code, name, logo, group, confederation, eliminated, advanced, fixtures
        case stats = "aggregateStats"
    }
}

struct TeamStats: Decodable {
    let played: Int?
    let wins: Int?
    let draws: Int?
    let losses: Int?
    let goalsFor: Int?
    let goalsAgainst: Int?

    enum CodingKeys: String, CodingKey {
        case played, wins, draws, losses
        case goalsFor = "gf"
        case goalsAgainst = "ga"
    }
}

struct Fixture: Decodable, Identifiable {
    var id: String { [date, opponent, round].compactMap { $0 }.joined(separator: "-") }
    let opponent: String?
    let date: String?
    let venue: String?
    let round: String?
    let result: String?
    let score: String?
    let status: String?
    let myScore: Int?
    let oppScore: Int?

    var scoreline: String? {
        if let myScore, let oppScore { return "\(myScore)–\(oppScore)" }
        return score
    }

    var kickoffDate: Date? {
        guard let date else { return nil }
        var normalized = date.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalized.hasSuffix("Z"),
           let separator = normalized.lastIndex(of: "T"),
           normalized[normalized.index(after: separator)..<normalized.index(before: normalized.endIndex)].count == 5 {
            normalized.insert(contentsOf: ":00", at: normalized.index(before: normalized.endIndex))
        }
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return parser.date(from: normalized) ?? {
            parser.formatOptions = [.withInternetDateTime]
            return parser.date(from: normalized)
        }() ?? parseShortISODate(date)
    }

    private func parseShortISODate(_ value: String) -> Date? {
        // ESPN currently sends scheduled matches as `2026-07-15T19:00Z`.
        // Parse that stable shape directly so behavior does not vary between
        // Foundation versions on the simulator and a physical iPhone.
        if value.count == 17, value.hasSuffix("Z") {
            let characters = Array(value)
            func number(_ range: Range<Int>) -> Int? {
                Int(String(characters[range]))
            }
            if characters[4] == "-", characters[7] == "-", characters[10] == "T", characters[13] == ":",
               let year = number(0..<4), let month = number(5..<7), let day = number(8..<10),
               let hour = number(11..<13), let minute = number(14..<16) {
                var calendar = Calendar(identifier: .gregorian)
                calendar.timeZone = TimeZone(secondsFromGMT: 0)!
                return calendar.date(from: DateComponents(
                    timeZone: calendar.timeZone,
                    year: year,
                    month: month,
                    day: day,
                    hour: hour,
                    minute: minute
                ))
            }
        }

        let parser = DateFormatter()
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.calendar = Calendar(identifier: .gregorian)
        parser.timeZone = TimeZone(secondsFromGMT: 0)
        for format in ["yyyy-MM-dd'T'HH:mmXXXXX", "yyyy-MM-dd'T'HH:mm:ssXXXXX", "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"] {
            parser.dateFormat = format
            if let parsed = parser.date(from: value) { return parsed }
        }
        return nil
    }

    var cardBadge: String {
        if result != nil, let scoreline { return scoreline }
        if let result { return result }
        // ESPN's pre-match status can contain a kickoff formatted in an
        // upstream time zone. When an ISO date exists, only show our locally
        // converted calendar line so the card never presents two times.
        if date != nil { return "UPCOMING" }
        return status ?? "TBD"
    }
}

@MainActor
final class TournamentStore: ObservableObject {
    @Published var teams: [Team] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var lastUpdated: Date?
    @Published var bracket: Bracket?

    var advancedCodes: Set<String> {
        Set((bracket?.rounds ?? []).flatMap(\.matches).compactMap { match in
            match.winner == "home" ? match.home.code : match.winner == "away" ? match.away.code : nil
        })
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            var request = URLRequest(url: apiURL)
            request.timeoutInterval = 15
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            let snapshot = try JSONDecoder().decode(Snapshot.self, from: data)
            teams = snapshot.teams.values.sorted { $0.name < $1.name }
            bracket = snapshot.bracket
            lastUpdated = .now
        } catch {
            errorMessage = "Live tournament data is unavailable. Pull to try again."
        }
    }
}

struct ContentView: View {
    @StateObject private var store = TournamentStore()

    var body: some View {
        TabView {
            NavigationStack {
                BracketScreen(store: store)
            }
            .tabItem { Label("Bracket", systemImage: "point.3.connected.trianglepath.dotted") }

            NavigationStack {
                TeamDirectory(store: store)
            }
            .tabItem { Label("Teams", systemImage: "flag.2.crossed.fill") }
        }
        .tint(.yellow)
        .preferredColorScheme(.dark)
        .environment(\.timeZone, .autoupdatingCurrent)
        .task { if store.teams.isEmpty { await store.load() } }
    }
}

struct TeamDirectory: View {
    @ObservedObject var store: TournamentStore

    var body: some View {
        ZStack {
            AppBackground()
            List {
                Section {
                    ForEach(store.teams) { team in
                        NavigationLink(value: team) {
                            TeamRow(team: team, isAdvanced: store.advancedCodes.contains(team.code))
                        }
                        .listRowBackground(Color.white.opacity(0.045))
                    }
                } header: {
                    statusHeader
                }
            }
            .scrollContentBackground(.hidden)
            .refreshable { await store.load() }
            .overlay {
                if store.isLoading && store.teams.isEmpty { ProgressView("Loading teams…") }
                if let message = store.errorMessage, store.teams.isEmpty {
                    ContentUnavailableView("Couldn’t Load the Teams", systemImage: "wifi.exclamationmark", description: Text(message))
                } else if !store.isLoading && store.teams.isEmpty {
                    ContentUnavailableView("No Teams", systemImage: "flag.2.crossed", description: Text("Pull to refresh tournament data."))
                }
            }
        }
        .navigationTitle("Teams")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .navigationDestination(for: Team.self) { TeamDetail(team: $0) }
    }

    private var statusHeader: some View {
        HStack {
            Label(store.errorMessage == nil ? "Live tournament data" : "Offline", systemImage: "circle.fill")
                .foregroundStyle(store.errorMessage == nil ? .green : .orange)
            Spacer()
            if let date = store.lastUpdated { Text(date, style: .time).foregroundStyle(.secondary) }
        }
        .font(.caption.weight(.semibold))
    }
}

private let bracketOrder = [
    "FRA", "SWE", "GER", "PAR", "BRA", "JPN", "CIV", "NOR",
    "MEX", "ECU", "ENG", "COD", "ARG", "CPV", "AUS", "EGY",
    "SUI", "ALG", "COL", "GHA", "BEL", "SEN", "USA", "BIH",
    "AUT", "ESP", "CRO", "POR", "MAR", "NED", "RSA", "CAN"
]

// app.js measures from 12 o'clock (`startAngle: -39.375`). SwiftUI measures
// from 3 o'clock, so the exact equivalent is 90° lower.
private let wheelStartAngle = -129.375

struct BracketScreen: View {
    @ObservedObject var store: TournamentStore
    @State private var selected: Team?

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("FIFA WORLD CUP 2026").font(.caption.bold()).foregroundStyle(.yellow)
                            Text("Knockout Map").font(.largeTitle.weight(.black))
                        }
                        Spacer()
                        Label(store.errorMessage == nil ? "LIVE DATA" : "OFFLINE", systemImage: "circle.fill")
                            .font(.caption2.bold()).foregroundStyle(store.errorMessage == nil ? .green : .orange)
                            .padding(.horizontal, 10).padding(.vertical, 7)
                            .background(.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.horizontal)

                    KnockoutWheel(teams: store.teams, bracket: store.bracket, selected: $selected)
                        .frame(maxWidth: 740)
                        .frame(height: min(UIScreen.main.bounds.width, 720))
                        .frame(maxWidth: .infinity)

                    if let selected {
                        NavigationLink(value: selected) {
                            SelectedTeamCard(team: selected, isAdvanced: store.advancedCodes.contains(selected.code))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal)
                    } else {
                        Text("Tap a flag to explore the team")
                            .font(.subheadline).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.vertical)
            }
            .refreshable { await store.load() }
            .overlay {
                if store.isLoading && store.teams.isEmpty { ProgressView("Loading bracket…") }
                if let message = store.errorMessage, store.teams.isEmpty {
                    ContentUnavailableView("Couldn’t Load the Cup", systemImage: "wifi.exclamationmark", description: Text(message))
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(for: Team.self) { TeamDetail(team: $0) }
    }
}

struct KnockoutWheel: View {
    let teams: [Team]
    let bracket: Bracket?
    @Binding var selected: Team?

    private var orderedTeams: [Team] {
        let lookup = Dictionary(uniqueKeysWithValues: teams.map { ($0.code, $0) })
        let bracketSides = Dictionary(uniqueKeysWithValues: (bracket?.rounds.first(where: { $0.key == "R32" })?.matches ?? [])
            .flatMap { [$0.home, $0.away] }
            .compactMap { side -> (String, BracketSide)? in
                guard let code = side.code else { return nil }
                return (code, side)
            })
        return bracketOrder.map { code in
            if let team = lookup[code] { return team }
            let side = bracketSides[code]
            return Team(
                code: code,
                name: side?.name ?? code,
                logo: side?.logo,
                group: nil,
                confederation: nil,
                eliminated: eliminatedCodes.contains(code),
                advanced: advancedCodes.contains(code),
                stats: nil,
                fixtures: nil
            )
        }
    }

    private var advancedCodes: Set<String> {
        Set((bracket?.rounds ?? []).flatMap(\.matches).compactMap(winnerCode))
    }

    private var eliminatedCodes: Set<String> {
        Set((bracket?.rounds ?? []).flatMap(\.matches).compactMap { match in
            guard match.winner != nil else { return nil }
            return match.winner == "home" ? match.away.code : match.home.code
        })
    }

    var body: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)
            let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)
            let outer = side * 0.452
            let nodeSize = max(25, min(42, side * 0.075))
            let layout = wheelLayout(center: center, outerRadius: outer)
            ZStack {
                Canvas { context, _ in
                    drawConnectors(context: &context, layout: layout, center: center, outerRadius: outer)
                }
                ForEach(Array(orderedTeams.enumerated()), id: \.element.id) { index, team in
                    let angle = (wheelStartAngle + Double(index) * 11.25) * .pi / 180
                    let point = CGPoint(x: center.x + cos(angle) * outer, y: center.y + sin(angle) * outer)
                    Button { withAnimation(.snappy) { selected = team } } label: {
                        FlagView(team: team, size: nodeSize)
                            .saturation(team.eliminated == true ? 0.15 : 1)
                            .opacity(team.eliminated == true ? 0.48 : 1)
                            .overlay(Circle().stroke(selected?.code == team.code ? Color.yellow : advancedCodes.contains(team.code) ? .white : .clear, lineWidth: 3))
                            .shadow(color: selected?.code == team.code ? .yellow.opacity(0.5) : .black.opacity(0.5), radius: 5)
                    }
                    .buttonStyle(.plain).position(point)
                    .accessibilityLabel(team.name)
                }
                ForEach(layout.advancementNodes) { node in
                    if let team = teams.first(where: { $0.code == node.code }) {
                        Button { withAnimation(.snappy) { selected = team } } label: {
                            FlagView(team: team, size: max(18, nodeSize * (node.round == 0 ? 0.70 : 0.62)))
                                .overlay(Circle().stroke(.white.opacity(0.7), lineWidth: 1.5))
                                .shadow(color: .black.opacity(0.55), radius: 4)
                        }
                        .buttonStyle(.plain)
                        .position(node.point)
                        .accessibilityLabel("\(team.name) advanced")
                    }
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private struct AdvanceNode: Identifiable {
        let id: String
        let code: String
        let point: CGPoint
        let round: Int
    }

    private struct WheelLayout {
        var connectorGroups: [[Connector]]
        var advancementNodes: [AdvanceNode]
    }

    private struct Connector {
        let first: CGPoint
        let second: CGPoint
        let firstRail: CGPoint
        let secondRail: CGPoint
        let control: CGPoint
        let join: CGPoint
        let parent: CGPoint
        let winnerBranch: Int?
        let hasWinner: Bool
    }

    private func wheelLayout(center: CGPoint, outerRadius: CGFloat) -> WheelLayout {
        // Exact ratios from app.js geometry, normalized against teamRadius 452.
        let parentScale: [CGFloat] = [330.0 / 452.0, 250.0 / 452.0, 178.0 / 452.0, 118.0 / 452.0]
        let railScale: [CGFloat] = [365.0 / 452.0, 286.0 / 452.0, 218.0 / 452.0, 154.0 / 452.0]
        let roundsByKey = Dictionary(uniqueKeysWithValues: (bracket?.rounds ?? []).map { ($0.key, $0) })
        let roundKeys = ["R32", "R16", "QF", "SF"]
        var sourcePointByCode = Dictionary(uniqueKeysWithValues: bracketOrder.enumerated().map {
            ($0.element, polar(slotAngle($0.offset), radius: outerRadius, center: center))
        })
        var previousParents: [CGPoint] = []
        var previousCodes: [String?] = []
        var groups: [[Connector]] = []
        var nodes: [AdvanceNode] = []

        for round in 0..<4 {
            let expectedCount = 16 / Int(pow(2.0, Double(round)))
            let matches = roundsByKey[roundKeys[round]]?.matches ?? []
            let count = matches.isEmpty ? expectedCount : matches.count
            var connectors: [Connector] = []
            var parents: [CGPoint] = []
            var roundWinnerCodes: [String?] = []
            for index in 0..<count {
                let match = index < matches.count ? matches[index] : nil
                let first: CGPoint
                let second: CGPoint
                let sourceCodes: [String?]
                if let match,
                   let homeCode = match.home.code,
                   let awayCode = match.away.code,
                   let homePoint = sourcePointByCode[homeCode],
                   let awayPoint = sourcePointByCode[awayCode] {
                    first = homePoint
                    second = awayPoint
                    sourceCodes = [homeCode, awayCode]
                } else if round == 0 {
                    let firstCode = bracketOrder[index * 2]
                    let secondCode = bracketOrder[index * 2 + 1]
                    first = sourcePointByCode[firstCode]!
                    second = sourcePointByCode[secondCode]!
                    sourceCodes = [firstCode, secondCode]
                } else {
                    first = previousParents[index * 2]
                    second = previousParents[index * 2 + 1]
                    sourceCodes = [previousCodes[index * 2], previousCodes[index * 2 + 1]]
                }
                let firstAngle = atan2(first.y - center.y, first.x - center.x)
                let secondAngle = atan2(second.y - center.y, second.x - center.x)
                let parentAngle = midpointAngle(firstAngle, secondAngle)
                let firstRail = polar(firstAngle, radius: outerRadius * railScale[round], center: center)
                let secondRail = polar(secondAngle, radius: outerRadius * railScale[round], center: center)
                let control = polar(parentAngle, radius: outerRadius * railScale[round] + outerRadius * (16.0 / 452.0), center: center)
                let join = quadraticPoint(firstRail, control, secondRail, t: 0.5)
                let parent = polar(parentAngle, radius: outerRadius * parentScale[round], center: center)
                let winnerCode = winnerCode(match)
                let isActiveWinner = winnerCode.map { !eliminatedCodes.contains($0) } ?? false
                let winnerBranch: Int? = {
                    guard let winnerCode, isActiveWinner else { return nil }
                    if sourceCodes[0] == winnerCode { return 0 }
                    if sourceCodes[1] == winnerCode { return 1 }
                    return nil
                }()
                connectors.append(Connector(first: first, second: second, firstRail: firstRail, secondRail: secondRail, control: control, join: join, parent: parent, winnerBranch: winnerBranch, hasWinner: isActiveWinner))
                parents.append(parent)
                roundWinnerCodes.append(winnerCode)
                if let winnerCode {
                    sourcePointByCode[winnerCode] = parent
                    nodes.append(AdvanceNode(id: "\(round)-\(index)-\(winnerCode)", code: winnerCode, point: parent, round: round))
                }
            }
            groups.append(connectors)
            previousParents = parents
            previousCodes = roundWinnerCodes
        }
        return WheelLayout(connectorGroups: groups, advancementNodes: nodes)
    }

    private func drawConnectors(context: inout GraphicsContext, layout: WheelLayout, center: CGPoint, outerRadius: CGFloat) {
        let base = Color(red: 0.70, green: 0.69, blue: 0.62).opacity(0.32)
        for group in layout.connectorGroups {
            for connector in group {
                drawLine(context: &context, from: connector.first, to: connector.firstRail, highlighted: connector.winnerBranch == 0)
                drawLine(context: &context, from: connector.second, to: connector.secondRail, highlighted: connector.winnerBranch == 1)

                let middle = connector.join
                let firstControl = midpoint(connector.firstRail, connector.control)
                let secondControl = midpoint(connector.control, connector.secondRail)
                var firstCurve = Path(); firstCurve.move(to: connector.firstRail); firstCurve.addQuadCurve(to: middle, control: firstControl)
                context.stroke(firstCurve, with: .color(connector.winnerBranch == 0 ? .white : base), lineWidth: connector.winnerBranch == 0 ? 2.8 : 1.25)
                var secondCurve = Path(); secondCurve.move(to: middle); secondCurve.addQuadCurve(to: connector.secondRail, control: secondControl)
                context.stroke(secondCurve, with: .color(connector.winnerBranch == 1 ? .white : base), lineWidth: connector.winnerBranch == 1 ? 2.8 : 1.25)
                drawLine(context: &context, from: middle, to: connector.parent, highlighted: connector.hasWinner)
            }
        }
        if let semifinals = layout.connectorGroups.last, semifinals.count == 2 {
            for connector in semifinals {
                let side: CGFloat = connector.parent.x < center.x ? -1 : 1
                let target = CGPoint(x: center.x + side * outerRadius * 0.04, y: center.y)
                drawLine(context: &context, from: connector.parent, to: target, highlighted: connector.hasWinner)
            }
        }
    }

    private func drawLine(context: inout GraphicsContext, from: CGPoint, to: CGPoint, highlighted: Bool) {
        var path = Path(); path.move(to: from); path.addLine(to: to)
        context.stroke(path, with: .color(highlighted ? .white : Color(red: 0.70, green: 0.69, blue: 0.62).opacity(0.32)), lineWidth: highlighted ? 2.8 : 1.25)
    }

    private func winnerCode(_ match: BracketMatch?) -> String? {
        guard let match else { return nil }
        if match.winner == "home" { return match.home.code }
        if match.winner == "away" { return match.away.code }
        return nil
    }

    private func slotAngle(_ slot: Int) -> CGFloat { (wheelStartAngle + Double(slot) * 11.25) * .pi / 180 }
    private func polar(_ angle: CGFloat, radius: CGFloat, center: CGPoint) -> CGPoint {
        CGPoint(x: center.x + cos(angle) * radius, y: center.y + sin(angle) * radius)
    }
    private func midpointAngle(_ left: CGFloat, _ right: CGFloat) -> CGFloat {
        var delta = right - left
        while delta > .pi { delta -= .pi * 2 }
        while delta < -.pi { delta += .pi * 2 }
        return left + delta / 2
    }
    private func midpoint(_ left: CGPoint, _ right: CGPoint) -> CGPoint {
        CGPoint(x: (left.x + right.x) / 2, y: (left.y + right.y) / 2)
    }
    private func quadraticPoint(_ start: CGPoint, _ control: CGPoint, _ end: CGPoint, t: CGFloat) -> CGPoint {
        let inverse = 1 - t
        return CGPoint(x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
                       y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y)
    }
}

struct SelectedTeamCard: View {
    let team: Team
    let isAdvanced: Bool
    var body: some View {
        HStack(spacing: 14) {
            FlagView(team: team, size: 54)
            VStack(alignment: .leading, spacing: 4) {
                Text(team.name).font(.title3.bold()).foregroundStyle(.primary)
                Text([team.confederation, team.group.map { "Group \($0.replacingOccurrences(of: "Group ", with: ""))" }].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(team.eliminated == true ? "ELIMINATED" : isAdvanced ? "ADVANCED" : "VIEW TEAM")
                .font(.caption2.bold()).foregroundStyle(team.eliminated == true ? Color.secondary : Color.yellow)
            Image(systemName: "chevron.right").foregroundStyle(.secondary)
        }
        .padding(16)
        .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.08)))
    }
}

struct AppBackground: View {
    var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.07, blue: 0.06)
            RadialGradient(colors: [.yellow.opacity(0.17), .clear], center: .center, startRadius: 10, endRadius: 260)
            LinearGradient(colors: [.green.opacity(0.10), .clear], startPoint: .topLeading, endPoint: .center)
        }.ignoresSafeArea()
    }
}

struct TeamRow: View {
    let team: Team
    let isAdvanced: Bool
    var body: some View {
        HStack(spacing: 14) {
            FlagView(team: team, size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text(team.name).font(.headline)
                Text([team.code, team.group.map { "Group \($0)" }].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if team.eliminated == true { Text("OUT").foregroundStyle(.secondary) }
            else if isAdvanced { Image(systemName: "checkmark.circle.fill").foregroundStyle(.green) }
        }
        .padding(.vertical, 4)
    }
}

struct TeamDetail: View {
    let team: Team
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack(spacing: 18) {
                    FlagView(team: team, size: 72)
                    VStack(alignment: .leading) {
                        Text(team.name).font(.largeTitle.bold())
                        Text([team.confederation, team.group.map { "Group \($0)" }].compactMap { $0 }.joined(separator: " · "))
                            .foregroundStyle(.secondary)
                    }
                }
                if let stats = team.stats { StatsGrid(stats: stats) }
                if let fixtures = team.fixtures, !fixtures.isEmpty {
                    Text("Tournament Path").font(.title2.bold())
                    ForEach(fixtures) { fixture in FixtureCard(fixture: fixture) }
                }
            }
            .padding(24)
            .frame(maxWidth: 720, alignment: .leading)
        }
        .background(AppBackground())
        .navigationTitle(team.code)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct StatsGrid: View {
    let stats: TeamStats
    var body: some View {
        Grid(horizontalSpacing: 12, verticalSpacing: 12) {
            GridRow {
                stat("Played", stats.played); stat("Wins", stats.wins); stat("Draws", stats.draws)
            }
            GridRow {
                stat("Losses", stats.losses); stat("Goals", stats.goalsFor); stat("Against", stats.goalsAgainst)
            }
        }
    }
    private func stat(_ label: String, _ value: Int?) -> some View {
        VStack(spacing: 5) { Text(value.map(String.init) ?? "—").font(.title2.bold()); Text(label).font(.caption).foregroundStyle(.secondary) }
            .frame(maxWidth: .infinity).padding().background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))
    }
}

struct FixtureCard: View {
    let fixture: Fixture
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text(fixture.opponent.map { "vs \($0)" } ?? "Match TBD").font(.headline)
                if let kickoff = fixture.kickoffDate {
                    Label {
                        Text(kickoff, format: .dateTime
                            .weekday(.abbreviated)
                            .month(.abbreviated)
                            .day()
                            .hour()
                            .minute()
                            .timeZone(.specificName(.short)))
                    } icon: {
                        Image(systemName: "calendar")
                    }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                Text([fixture.round, fixture.venue].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(fixture.cardBadge).font(.headline).foregroundStyle(.yellow)
        }
        .padding().background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))
    }
}

struct FlagView: View {
    let team: Team
    let size: CGFloat
    var body: some View {
        AsyncImage(url: flagURL(for: team.code) ?? team.logo.flatMap(URL.init(string:))) { phase in
            if let image = phase.image {
                image
                    .resizable()
                    .scaledToFill()
                    .frame(width: size, height: size)
                    .clipped()
            } else {
                Text(flagEmoji(for: team.code))
                    .font(.system(size: size * 0.72))
                    .frame(width: size, height: size)
                    .background(.white.opacity(0.08))
            }
        }
        .frame(width: size, height: size).clipShape(Circle())
        .overlay(Circle().stroke(.white.opacity(0.3), lineWidth: 1))
    }
    private func flagURL(for code: String) -> URL? {
        guard let iso = isoCode(for: code) else { return nil }
        return URL(string: "https://flagcdn.com/w160/\(iso.lowercased()).png")
    }
    private func isoCode(for code: String) -> String? {
        let iso: [String: String] = [
            "USA":"US","MEX":"MX","ARG":"AR","GER":"DE","ESP":"ES","POR":"PT",
            "FRA":"FR","SEN":"SN","BRA":"BR","CAN":"CA","ENG":"GB","JPN":"JP",
            "NED":"NL","MAR":"MA","COL":"CO","BEL":"BE","URU":"UY","AUS":"AU",
            "SUI":"CH","KOR":"KR","CRO":"HR","POL":"PL","DEN":"DK","NGA":"NG",
            "ECU":"EC","GHA":"GH","EGY":"EG","ALG":"DZ","SWE":"SE","NOR":"NO",
            "QAT":"QA","KSA":"SA","PAR":"PY","CIV":"CI","COD":"CD","CPV":"CV",
            "BIH":"BA","AUT":"AT","RSA":"ZA"
        ]
        return iso[code]
    }
    private func flagEmoji(for code: String) -> String {
        return (isoCode(for: code) ?? code.prefix(2).uppercased()).unicodeScalars.compactMap { UnicodeScalar(127397 + Int($0.value)) }.map(String.init).joined()
    }
}

extension Team: Hashable {
    static func == (lhs: Team, rhs: Team) -> Bool { lhs.code == rhs.code }
    func hash(into hasher: inout Hasher) { hasher.combine(code) }
}
