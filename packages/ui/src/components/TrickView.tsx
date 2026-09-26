import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  teamOfSeat,
  type CompletedTrick,
  type GameState,
  type Seat,
  type TeamId,
} from "@sakkah-baloot/game-engine";
import { CardView } from "./CardView";
import { seatArabicName } from "./SeatView";

export interface TrickViewProps {
  readonly plays: readonly GameState["currentTrick"][number][];
  readonly activeSeat: Seat;
  readonly lastCompletedTrick: CompletedTrick | null;
  readonly frozenTrick: CompletedTrick | null;
}

export function TrickView({
  plays,
  activeSeat,
  lastCompletedTrick,
  frozenTrick,
}: TrickViewProps) {
  const seats: readonly Seat[] = ["NORTH", "EAST", "SOUTH", "WEST"] as const;
  const isFrozen = frozenTrick !== null;
  const currentPlays = isFrozen ? frozenTrick.plays : plays;
  const winnerSeat = isFrozen ? frozenTrick.winnerSeat : null;
  const trickNum = isFrozen
    ? frozenTrick.trickNumber
    : (lastCompletedTrick ? lastCompletedTrick.trickNumber : null);

  return (
    <View style={styles.trickContainer} testID="trick-arena">
      {/* Completed trick winner banner during 2-second hold */}
      {isFrozen && winnerSeat ? (
        <View style={styles.frozenWinnerBanner}>
          <Text style={styles.frozenWinnerText}>
            🏆 الأكلة {trickNum} — فاز بها:{" "}
            <Text style={styles.frozenWinnerHighlight}>
              {seatArabicName(winnerSeat)}
            </Text>{" "}
            ({teamLabel(teamOfSeat(winnerSeat))})
          </Text>
        </View>
      ) : lastCompletedTrick && plays.length === 0 ? (
        <View style={styles.lastWinnerBadge}>
          <Text style={styles.lastWinnerText}>
            الأكلة {lastCompletedTrick.trickNumber} فاز بها:{" "}
            <Text style={styles.lastWinnerHighlight}>
              {seatArabicName(lastCompletedTrick.winnerSeat)}
            </Text>{" "}
            ({teamLabel(teamOfSeat(lastCompletedTrick.winnerSeat))})
          </Text>
        </View>
      ) : null}

      {/* 4-Compass Trick Arena */}
      <View style={styles.trickArena}>
        {seats.map((seat) => {
          const play = currentPlays.find((p) => p.seat === seat);
          const isSeatActive = !isFrozen && activeSeat === seat && !play;
          const isWinnerCard = isFrozen && winnerSeat === seat;
          const slotStyle = getTrickSlotStyle(seat);
          const isLana = teamOfSeat(seat) === "NORTH_SOUTH";

          if (play) {
            return (
              <View key={seat} style={[styles.trickCardSlot, slotStyle]}>
                <View
                  style={[
                    styles.trickSeatTag,
                    isLana ? styles.seatTagLana : styles.seatTagLahum,
                    isWinnerCard && styles.seatTagWinner,
                  ]}
                >
                  <Text
                    style={[
                      styles.trickSeatTagText,
                      isWinnerCard && styles.trickSeatTagTextWinner,
                    ]}
                  >
                    {isWinnerCard ? `👑 ${seatArabicName(seat)}` : seatArabicName(seat)}
                  </Text>
                </View>
                <CardView
                  card={play.card}
                  size="medium"
                  highlight={isWinnerCard}
                  winnerGlow={isWinnerCard}
                />
              </View>
            );
          }

          return (
            <View
              key={seat}
              style={[
                styles.trickEmptySlot,
                slotStyle,
                isSeatActive && styles.trickActiveEmptySlot,
              ]}
            >
              <Text
                style={[
                  styles.trickEmptySlotText,
                  isSeatActive && styles.trickActiveEmptyText,
                ]}
              >
                {isSeatActive ? "يلعب الآن" : seatArabicName(seat)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function teamLabel(team: TeamId): string {
  return team === "NORTH_SOUTH" ? "لنا" : "لهم";
}

function getTrickSlotStyle(seat: Seat) {
  switch (seat) {
    case "NORTH": return styles.trickNorth;
    case "SOUTH": return styles.trickSouth;
    case "EAST": return styles.trickEast;
    case "WEST": return styles.trickWest;
  }
}

const styles = StyleSheet.create({
  trickContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 180,
    zIndex: 15,
  },
  frozenWinnerBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FEF3C7",
    marginBottom: 6,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  frozenWinnerText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  frozenWinnerHighlight: {
    color: "#78350F",
    fontWeight: "900",
  },
  lastWinnerBadge: {
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginBottom: 4,
  },
  lastWinnerText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  lastWinnerHighlight: {
    color: "#FDE68A",
    fontWeight: "900",
  },
  trickArena: {
    width: 200,
    height: 160,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  trickCardSlot: {
    position: "absolute",
    alignItems: "center",
  },
  trickEmptySlot: {
    position: "absolute",
    width: 44,
    height: 64,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  trickActiveEmptySlot: {
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  trickEmptySlotText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  trickActiveEmptyText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "900",
  },
  trickNorth: {
    top: 4,
    alignSelf: "center",
  },
  trickSouth: {
    bottom: 4,
    alignSelf: "center",
  },
  trickEast: {
    right: 12,
    top: 48,
  },
  trickWest: {
    left: 12,
    top: 48,
  },
  trickSeatTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 2,
  },
  seatTagLana: {
    backgroundColor: "rgba(6, 78, 59, 0.9)",
  },
  seatTagLahum: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
  },
  seatTagWinner: {
    backgroundColor: "#F59E0B",
  },
  trickSeatTagText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "800",
  },
  trickSeatTagTextWinner: {
    color: "#0F172A",
    fontWeight: "900",
  },
});
