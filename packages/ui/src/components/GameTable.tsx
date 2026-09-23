import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BiddingAction, Card, CardId, GameState, MatchEndResult, MatchScore, RoundScoreBreakdown, Seat, Suit } from "@sakkah-baloot/game-engine";

type BiddingActionType = BiddingAction["type"];

interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly hand: readonly Card[];
  readonly legalActions: readonly BiddingActionType[];
  readonly legalCardIds?: readonly CardId[];
  readonly game?: GameState | null;
  readonly playerSeat?: Seat;
  readonly onBiddingAction?: (action: BiddingActionType, suit?: Suit) => void;
  readonly onCardPlay?: (cardId: CardId) => void;
  readonly onNextRound?: (() => void) | undefined;
  readonly roundScore?: RoundScoreBreakdown | null;
  readonly matchScore?: MatchScore;
  readonly matchEnd?: MatchEndResult;
}

export function GameTable({
  dealerSeat, actingSeat, phase, exposedCard, hand, legalActions, legalCardIds = [], game = null,
  playerSeat = "SOUTH", onBiddingAction, onCardPlay, onNextRound, roundScore, matchScore, matchEnd,
}: GameTableProps) {
  const playerIsActing = actingSeat === playerSeat;
  const actions = playerIsActing ? legalActions : [];
  const hokumSuits = actions.includes("BUY_HOKUM") ? availableHokumSuits(exposedCard?.suit ?? null) : [];
  const trickCards = game?.currentTrick ?? [];
  const isRoundComplete = game?.phase === "ROUND_COMPLETE";

  return (
    <View style={styles.screen}>
      <View style={styles.table}>
        <SeatView label="NORTH" active={game ? game.currentPlayerId === "NORTH" : actingSeat === "NORTH"} style={styles.north} />
        <SeatView label="WEST" active={game ? game.currentPlayerId === "WEST" : actingSeat === "WEST"} style={styles.west} />
        <SeatView label="EAST" active={game ? game.currentPlayerId === "EAST" : actingSeat === "EAST"} style={styles.east} />
        <View style={styles.center}>
          <Text style={styles.logo}>صكّة</Text>
          <Text style={styles.phase}>{game ? `الطقطقة ${game.trickNumber}` : formatPhase(phase)}</Text>
          {!game ? <><Text style={styles.meta}>Dealer: {dealerSeat}</Text><View style={styles.exposed}><Text style={styles.exposedLabel}>المكشوفة</Text><CardView card={exposedCard} compact /></View></> : null}
          {game && !isRoundComplete ? <TrickView plays={trickCards} /> : null}
          {isRoundComplete && roundScore ? (
            <RoundResult
              score={roundScore}
              matchScore={matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 }}
              matchEnd={matchEnd ?? { status: "ONGOING", score: matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 } }}
              onNextRound={onNextRound}
            />
          ) : null}
        </View>
        <View style={styles.south}>
          <SeatView label="SOUTH" active={game ? game.currentPlayerId === "SOUTH" : playerIsActing} />
          <View style={styles.hand}>
            {hand.map((card) => <CardButton key={card.id} card={card} enabled={legalCardIds.includes(card.id)} onPress={onCardPlay} />)}
          </View>
          {actions.length > 0 ? (
            <View style={styles.actions}>
              {actions.filter((action) => action !== "BUY_HOKUM").map((action) => <Action key={action} action={action} onPress={onBiddingAction} />)}
              {hokumSuits.map((suit) => <Action key={`BUY_HOKUM-${suit}`} action="BUY_HOKUM" suit={suit} onPress={onBiddingAction} />)}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function RoundResult({
  score, matchScore, matchEnd, onNextRound,
}: {
  score: RoundScoreBreakdown;
  matchScore: MatchScore;
  matchEnd: MatchEndResult;
  onNextRound?: (() => void) | undefined;
}) {
  const canContinue = matchEnd.status !== "FINISHED";
  return (
    <View style={styles.result}>
      <Text style={styles.resultTitle}>نتيجة الجولة</Text>
      <Text style={styles.resultLine}>الكروت: {score.cardRaw.NORTH_SOUTH} — {score.cardRaw.EAST_WEST}</Text>
      <Text style={styles.resultLine}>المشاريع: {score.projectQaid.NORTH_SOUTH} — {score.projectQaid.EAST_WEST}</Text>
      <Text style={styles.resultLine}>بلوت: {score.balootQaid.NORTH_SOUTH} — {score.balootQaid.EAST_WEST}</Text>
      <Text style={styles.resultLine}>النتيجة: {score.finalQaid.NORTH_SOUTH} — {score.finalQaid.EAST_WEST}</Text>
      {score.kabootTeamId ? <Text style={styles.badge}>كابوت: {score.kabootTeamId === "NORTH_SOUTH" ? "شمال + جنوب" : "شرق + غرب"}</Text> : null}
      {score.reverseKaboot ? <Text style={styles.badge}>ريبيرس كابوت</Text> : null}
      <Text style={styles.matchLine}>المباراة: {matchScore.NORTH_SOUTH} — {matchScore.EAST_WEST}</Text>
      {matchEnd.status === "FINISHED" ? <Text style={styles.matchLine}>انتهت المباراة</Text> : null}
      {matchEnd.status === "EXTRA_DEAL" ? <Text style={styles.matchLine}>تعادل فوق الهدف — توزيع إضافي</Text> : null}
      {canContinue ? <Pressable accessibilityRole="button" onPress={onNextRound} style={styles.nextRound}><Text style={styles.nextRoundText}>{matchEnd.status === "EXTRA_DEAL" ? "توزيع إضافي" : "الجولة التالية"}</Text></Pressable> : null}
    </View>
  );
}

function TrickView({ plays }: { plays: readonly GameState["currentTrick"][number][] }) {
  if (plays.length === 0) return <Text style={styles.waiting}>ابدأ اللعب</Text>;
  return <View style={styles.trick}>{plays.map((play) => <View key={play.sequence} style={styles.trickCard}><Text style={styles.trickSeat}>{play.seat}</Text><CardView card={play.card} compact /></View>)}</View>;
}

function CardButton({ card, enabled, onPress }: { card: Card; enabled: boolean; onPress?: ((cardId: CardId) => void) | undefined }) {
  return <Pressable accessibilityRole="button" disabled={!enabled} onPress={() => onPress?.(card.id)} style={[styles.cardButton, !enabled && styles.disabledCard]}><CardView card={card} /></Pressable>;
}

function SeatView({ label, active, style }: { label: Seat; active: boolean; style?: object }) {
  return <View style={[styles.seat, style]}><View style={[styles.avatar, active && styles.active]} /><Text style={styles.seatText}>{label}</Text></View>;
}

function CardView({ card, compact = false }: { card: Card | null; compact?: boolean }) {
  return <View style={[styles.card, compact && styles.compactCard]}><Text style={[styles.rank, compact && styles.compactRank]}>{card?.rank ?? "—"}</Text><Text style={[styles.suit, compact && styles.compactSuit, card && isRedSuit(card) && styles.redSuit]}>{card ? suitSymbol(card.suit) : ""}</Text></View>;
}

function Action({ action, suit, onPress }: { action: BiddingActionType; suit?: Suit; onPress?: ((action: BiddingActionType, suit?: Suit) => void) | undefined }) {
  return <Pressable accessibilityRole="button" onPress={() => onPress?.(action, suit)} style={styles.action}><Text style={styles.actionText}>{actionLabel(action, suit)}</Text></Pressable>;
}

function actionLabel(action: BiddingActionType, suit?: Suit): string {
  if (action === "BUY_HOKUM" && suit !== undefined) return `حكم ${suitArabic(suit)}`;
  switch (action) {
    case "PASS": return "بس";
    case "DECLARE_KASHO": return "كاشو";
    case "BUY_HOKUM_EXPOSED": return "حكم";
    case "BUY_SUN": return "صن";
    case "BUY_ASHKAL": return "أشكال";
    case "BUY_HOKUM": return "حكم";
  }
}

function suitSymbol(suit: Suit): string {
  switch (suit) { case "CLUBS": return "♣"; case "DIAMONDS": return "♦"; case "HEARTS": return "♥"; case "SPADES": return "♠"; }
}

function suitArabic(suit: Suit): string {
  switch (suit) { case "CLUBS": return "كلوب"; case "DIAMONDS": return "دينار"; case "HEARTS": return "هاص"; case "SPADES": return "سبيد"; }
}

function availableHokumSuits(exposedSuit: Suit | null): readonly Suit[] {
  return (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).filter((suit) => suit !== exposedSuit);
}

function isRedSuit(card: Card): boolean { return card.suit === "DIAMONDS" || card.suit === "HEARTS"; }

function formatPhase(phase: string): string {
  if (phase === "FIRST_ROUND") return "الجولة الأولى";
  if (phase === "SECOND_ROUND") return "الجولة الثانية";
  if (phase === "CONTRACT_SELECTED") return "تم اختيار اللعب";
  return phase;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  table: { flex: 1, minHeight: 520, borderRadius: 28, borderWidth: 2, borderColor: "#B89455", backgroundColor: "#123D31", alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: 6 },
  logo: { color: "#F5E6BF", fontSize: 34, fontWeight: "800" },
  phase: { color: "#FFFFFF", fontSize: 13, letterSpacing: 1 },
  meta: { color: "#BFD2C9", fontSize: 12 },
  exposed: { marginTop: 8, alignItems: "center", gap: 4 },
  exposedLabel: { color: "#BFD2C9", fontSize: 10 },
  seat: { position: "absolute", alignItems: "center", gap: 5 },
  north: { top: 14 }, west: { left: 20, top: "44%" }, east: { right: 20, top: "44%" },
  seatText: { color: "#E8F0EC", fontSize: 11 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#315C4E" },
  active: { borderWidth: 3, borderColor: "#E8C66A" },
  south: { position: "absolute", bottom: 12, alignItems: "center" },
  hand: { flexDirection: "row", gap: 6, marginTop: 10 },
  cardButton: { borderRadius: 7 },
  disabledCard: { opacity: 0.45 },
  card: { width: 52, height: 74, borderRadius: 7, backgroundColor: "#F7F2E8", justifyContent: "center", alignItems: "center", paddingVertical: 7 },
  compactCard: { width: 42, height: 58 },
  rank: { color: "#17231F", fontSize: 18, fontWeight: "800" },
  compactRank: { fontSize: 15 },
  suit: { color: "#17231F", fontSize: 20, lineHeight: 20 },
  compactSuit: { fontSize: 16, lineHeight: 16 },
  redSuit: { color: "#B33A3A" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, justifyContent: "center", maxWidth: 360 },
  action: { minWidth: 72, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: "#9D7B3C" },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", textAlign: "center" },
  trick: { flexDirection: "row", flexWrap: "wrap", width: 180, justifyContent: "center", gap: 6, marginTop: 12 },
  trickCard: { alignItems: "center", gap: 2 },
  trickSeat: { color: "#BFD2C9", fontSize: 8 },
  waiting: { color: "#BFD2C9", fontSize: 11, marginTop: 10 },
  result: { marginTop: 10, minWidth: 250, padding: 14, borderRadius: 14, backgroundColor: "#0D2C24", borderWidth: 1, borderColor: "#B89455", gap: 4 },
  resultTitle: { color: "#F5E6BF", fontSize: 16, fontWeight: "800" },
  resultLine: { color: "#E8F0EC", fontSize: 11 },
  badge: { color: "#E8C66A", fontSize: 11, fontWeight: "800" },
  matchLine: { color: "#BFD2C9", fontSize: 11, fontWeight: "700" },
  nextRound: { marginTop: 8, minWidth: 150, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18, backgroundColor: "#9D7B3C" },
  nextRoundText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", textAlign: "center" },
});
