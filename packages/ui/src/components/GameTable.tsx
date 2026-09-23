import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BiddingAction, Card, CardId, Seat } from "@sakkah-baloot/game-engine";

type BiddingActionType = BiddingAction["type"];

interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly hand: readonly Card[];
  readonly legalActions: readonly BiddingActionType[];
  readonly playerSeat?: Seat;
  readonly onBiddingAction?: (action: BiddingActionType) => void;
}

export function GameTable({
  dealerSeat,
  actingSeat,
  phase,
  exposedCard,
  hand,
  legalActions,
  playerSeat = "SOUTH",
  onBiddingAction,
}: GameTableProps) {
  const playerIsActing = actingSeat === playerSeat;
  const actions = playerIsActing ? legalActions : [];

  return (
    <View style={styles.screen}>
      <View style={styles.table}>
        <SeatView label="NORTH" active={actingSeat === "NORTH"} style={styles.north} />
        <SeatView label="WEST" active={actingSeat === "WEST"} style={styles.west} />
        <SeatView label="EAST" active={actingSeat === "EAST"} style={styles.east} />

        <View style={styles.center}>
          <Text style={styles.logo}>صكّة</Text>
          <Text style={styles.phase}>{formatPhase(phase)}</Text>
          <Text style={styles.meta}>Dealer: {dealerSeat}</Text>
          <View style={styles.exposed}>
            <Text style={styles.exposedLabel}>المكشوفة</Text>
            <CardView card={exposedCard} compact />
          </View>
        </View>

        <View style={styles.south}>
          <SeatView label="SOUTH" active={playerIsActing} />
          <View style={styles.hand}>
            {hand.map((card) => <CardView key={card.id} card={card} />)}
          </View>
          {actions.length > 0 ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <Action key={action} action={action} onPress={onBiddingAction} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SeatView({ label, active, style }: { label: Seat; active: boolean; style?: object }) {
  return (
    <View style={[styles.seat, style]}>
      <View style={[styles.avatar, active && styles.active]} />
      <Text style={styles.seatText}>{label}</Text>
    </View>
  );
}

function CardView({ card, compact = false }: { card: Card | null; compact?: boolean }) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Text style={[styles.rank, compact && styles.compactRank]}>{card?.rank ?? "—"}</Text>
      <Text style={[styles.suit, compact && styles.compactSuit, card && isRedSuit(card) && styles.redSuit]}>
        {card ? suitSymbol(card.suit) : ""}
      </Text>
    </View>
  );
}

function Action({ action, onPress }: { action: BiddingActionType; onPress?: (action: BiddingActionType) => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(action)} style={styles.action}>
      <Text style={styles.actionText}>{actionLabel(action)}</Text>
    </Pressable>
  );
}

function actionLabel(action: BiddingActionType): string {
  switch (action) {
    case "PASS": return "بس";
    case "DECLARE_KASHO": return "كاشو";
    case "BUY_HOKUM_EXPOSED": return "حكم";
    case "BUY_SUN": return "صن";
    case "BUY_ASHKAL": return "أشكال";
    case "BUY_HOKUM": return "حكم";
  }
}

function suitSymbol(suit: Card["suit"]): string {
  return { CLUBS: "♣", DIAMONDS: "♦", HEARTS: "♥", SPADES: "♠" }[suit];
}

function isRedSuit(card: Card): boolean {
  return card.suit === "DIAMONDS" || card.suit === "HEARTS";
}

function formatPhase(phase: string): string {
  if (phase === "FIRST_ROUND") return "الجولة الأولى";
  if (phase === "SECOND_ROUND") return "الجولة الثانية";
  if (phase === "CONTRACT_SELECTED") return "تم اختيار اللعب";
  return phase;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  table: {
    flex: 1,
    minHeight: 520,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#B89455",
    backgroundColor: "#123D31",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", gap: 6 },
  logo: { color: "#F5E6BF", fontSize: 34, fontWeight: "800" },
  phase: { color: "#FFFFFF", fontSize: 13, letterSpacing: 1 },
  meta: { color: "#BFD2C9", fontSize: 12 },
  exposed: { marginTop: 8, alignItems: "center", gap: 4 },
  exposedLabel: { color: "#BFD2C9", fontSize: 10 },
  seat: { position: "absolute", alignItems: "center", gap: 5 },
  north: { top: 14 },
  west: { left: 20, top: "44%" },
  east: { right: 20, top: "44%" },
  seatText: { color: "#E8F0EC", fontSize: 11 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#315C4E" },
  active: { borderWidth: 3, borderColor: "#E8C66A" },
  south: { position: "absolute", bottom: 12, alignItems: "center" },
  hand: { flexDirection: "row", gap: 6, marginTop: 10 },
  card: {
    width: 52, height: 74, borderRadius: 7, backgroundColor: "#F7F2E8",
    justifyContent: "center", alignItems: "center", paddingVertical: 7,
  },
  compactCard: { width: 42, height: 58 },
  rank: { color: "#17231F", fontSize: 18, fontWeight: "800" },
  compactRank: { fontSize: 15 },
  suit: { color: "#17231F", fontSize: 20, lineHeight: 20 },
  compactSuit: { fontSize: 16, lineHeight: 16 },
  redSuit: { color: "#B33A3A" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  action: { minWidth: 72, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: "#9D7B3C" },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", textAlign: "center" },
});
