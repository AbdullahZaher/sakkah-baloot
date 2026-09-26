import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Seat } from "@sakkah-baloot/game-engine";

export interface SeatViewProps {
  readonly label: Seat;
  readonly seatRole: string;
  readonly team: "LANA" | "LAHUM";
  readonly active: boolean;
  readonly isDealer: boolean;
  readonly isHuman?: boolean;
  readonly cardCount?: number | undefined;
  readonly style?: object;
}

export function SeatView({
  label,
  seatRole,
  team,
  active,
  isDealer,
  isHuman = false,
  cardCount,
  style,
}: SeatViewProps) {
  return (
    <View style={[styles.seatPod, style]} testID={`seat-view-${label}`}>
      <View
        style={[
          styles.avatarWrap,
          team === "LANA" ? styles.avatarLana : styles.avatarLahum,
          active && styles.avatarActive,
        ]}
      >
        <Text
          style={[
            styles.avatarInitial,
            team === "LANA" ? styles.avatarInitialLana : styles.avatarInitialLahum,
          ]}
        >
          {seatInitial(label)}
        </Text>
        {isDealer ? (
          <View style={styles.dealerChip}>
            <Text style={styles.dealerChipText}>D</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.seatBadge, active && styles.seatBadgeActive]}>
        <View style={styles.seatHeaderRow}>
          <Text style={[styles.seatLabel, active && styles.seatLabelActive]}>
            {seatArabicName(label)}
          </Text>
          {active ? (
            <View
              style={[
                styles.activeTurnPill,
                isHuman ? styles.humanTurnPill : styles.aiTurnPill,
              ]}
            >
              <Text style={styles.activeTurnPillText}>
                {isHuman ? "دورك" : "يفكّر..."}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.seatMetaRow}>
          <Text style={styles.seatSub}>{seatRole}</Text>
          {cardCount !== undefined ? (
            <Text style={styles.cardCount}>🂠 {cardCount}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function seatArabicName(seat: Seat): string {
  switch (seat) {
    case "NORTH": return "الشمال";
    case "WEST": return "الغرب";
    case "EAST": return "الشرق";
    case "SOUTH": return "الجنوب";
  }
}

export function seatInitial(seat: Seat): string {
  switch (seat) {
    case "NORTH": return "ش";
    case "WEST": return "غ";
    case "EAST": return "ق";
    case "SOUTH": return "ج";
  }
}

const styles = StyleSheet.create({
  seatPod: {
    alignItems: "center",
    zIndex: 20,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: -4,
    zIndex: 2,
  },
  avatarLana: {
    backgroundColor: "#064E3B",
    borderColor: "#34D399",
  },
  avatarLahum: {
    backgroundColor: "#1E293B",
    borderColor: "#94A3B8",
  },
  avatarActive: {
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "900",
  },
  avatarInitialLana: {
    color: "#6EE7B7",
  },
  avatarInitialLahum: {
    color: "#E2E8F0",
  },
  dealerChip: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  dealerChipText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  seatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    minWidth: 70,
  },
  seatBadgeActive: {
    borderColor: "rgba(245, 158, 11, 0.7)",
    backgroundColor: "rgba(15, 30, 22, 0.95)",
  },
  seatHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  seatLabel: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "800",
  },
  seatLabelActive: {
    color: "#FDE68A",
  },
  activeTurnPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  humanTurnPill: {
    backgroundColor: "#10B981",
  },
  aiTurnPill: {
    backgroundColor: "#D97706",
  },
  activeTurnPillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  seatMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  seatSub: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "600",
  },
  cardCount: {
    color: "#D8C28A",
    fontSize: 8,
    fontWeight: "800",
  },
});
