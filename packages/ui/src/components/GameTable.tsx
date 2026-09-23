import { StyleSheet, Text, View } from "react-native";

type Seat = "NORTH" | "EAST" | "SOUTH" | "WEST";
type CardId = string;

interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCardId: CardId | null;
  readonly hand: readonly CardId[];
}

export function GameTable({
  dealerSeat,
  actingSeat,
  phase,
  exposedCardId,
  hand,
}: GameTableProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.table}>
        <SeatView label="NORTH" active={actingSeat === "NORTH"} />
        <SeatView label="WEST" active={actingSeat === "WEST"} />
        <View style={styles.center}>
          <Text style={styles.logo}>صكّة</Text>
          <Text style={styles.phase}>{phase}</Text>
          <Text style={styles.meta}>Dealer: {dealerSeat}</Text>
          <Text style={styles.exposed}>Exposed: {exposedCardId ?? "—"}</Text>
        </View>
        <SeatView label="EAST" active={actingSeat === "EAST"} />
        <View style={styles.south}>
          <SeatView label="SOUTH" active={actingSeat === "SOUTH"} />
          <View style={styles.hand}>
            {hand.map((cardId) => (
              <View key={cardId} style={styles.card}>
                <Text style={styles.cardText}>{cardId.replace("-", " ")}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function SeatView({ label, active }: { label: Seat; active: boolean }) {
  return (
    <View style={styles.seat}>
      <View style={[styles.avatar, active && styles.active]} />
      <Text style={styles.seatText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  table: {
    flex: 1,
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
  exposed: { color: "#E5D3A8", fontSize: 12 },
  seat: { position: "absolute", alignItems: "center", gap: 5 },
  seatText: { color: "#E8F0EC", fontSize: 11 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#315C4E" },
  active: { borderWidth: 3, borderColor: "#E8C66A" },
  south: { position: "absolute", bottom: 12, alignItems: "center" },
  hand: { flexDirection: "row", gap: 6, marginTop: 10 },
  card: {
    width: 52,
    height: 74,
    borderRadius: 7,
    backgroundColor: "#F7F2E8",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: { color: "#17231F", fontSize: 8, textAlign: "center" },
});
