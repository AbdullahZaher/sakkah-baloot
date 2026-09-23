import { Pressable, StyleSheet, Text, View } from "react-native";

type Seat = "NORTH" | "EAST" | "SOUTH" | "WEST";
type CardId = string;

interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCardId: CardId | null;
  readonly hand: readonly CardId[];
}

export function GameTable({ dealerSeat, actingSeat, phase, exposedCardId, hand }: GameTableProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.table}>
        <SeatView label="NORTH" active={actingSeat === "NORTH"} style={styles.north} />
        <SeatView label="WEST" active={actingSeat === "WEST"} style={styles.west} />
        <SeatView label="EAST" active={actingSeat === "EAST"} style={styles.east} />

        <View style={styles.center}>
          <Text style={styles.logo}>صكّة</Text>
          <Text style={styles.phase}>{phase}</Text>
          <Text style={styles.meta}>Dealer: {dealerSeat}</Text>
          <View style={styles.exposed}>
            <Text style={styles.exposedLabel}>المكشوفة</Text>
            <Text style={styles.exposedCard}>{formatCard(exposedCardId)}</Text>
          </View>
        </View>

        <View style={styles.south}>
          <SeatView label="SOUTH" active={actingSeat === "SOUTH"} />
          <View style={styles.hand}>
            {hand.map((cardId) => <CardView key={cardId} cardId={cardId} />)}
          </View>
          {phase === "FIRST_ROUND" || phase === "SECOND_ROUND" ? (
            <View style={styles.actions}>
              <Action label="Pass" />
              <Action label="Sun" primary />
              <Action label="Hokum" primary />
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

function CardView({ cardId }: { cardId: CardId }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>{formatCard(cardId)}</Text>
    </View>
  );
}

function Action({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <Pressable style={[styles.action, primary && styles.primaryAction]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function formatCard(cardId: string | null) {
  if (!cardId) return "—";
  const [suit, rank] = cardId.split("-");
  const suits: Record<string, string> = { CLUBS: "♣", DIAMONDS: "♦", HEARTS: "♥", SPADES: "♠" };
  return `${suits[suit ?? ""] ?? ""}${rank ?? ""}`;
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
  phase: { color: "#FFFFFF", fontSize: 13, letterSpacing: 2 },
  meta: { color: "#BFD2C9", fontSize: 12 },
  exposed: { marginTop: 8, alignItems: "center" },
  exposedLabel: { color: "#BFD2C9", fontSize: 10 },
  exposedCard: { color: "#F7F2E8", fontSize: 22, fontWeight: "700" },
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
    justifyContent: "center", alignItems: "center",
  },
  cardText: { color: "#17231F", fontSize: 16, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  action: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: "#315C4E" },
  primaryAction: { backgroundColor: "#9D7B3C" },
  actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
