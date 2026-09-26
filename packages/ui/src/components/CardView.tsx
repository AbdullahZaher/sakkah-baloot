import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Card, Suit } from "@sakkah-baloot/game-engine";

export interface CardViewProps {
  readonly card: Card | null;
  readonly size?: "standard" | "medium" | "compact";
  readonly highlight?: boolean;
  readonly winnerGlow?: boolean;
}

export function CardView({
  card,
  size = "standard",
  highlight = false,
  winnerGlow = false,
}: CardViewProps) {
  if (!card) {
    return (
      <View
        style={[
          styles.card,
          size === "medium" && styles.mediumCard,
          size === "compact" && styles.compactCard,
          styles.emptyCard,
        ]}
      >
        <Text style={styles.emptyCardText}>—</Text>
      </View>
    );
  }

  const red = isRedSuit(card);

  return (
    <View
      style={[
        styles.card,
        size === "medium" && styles.mediumCard,
        size === "compact" && styles.compactCard,
        highlight && styles.cardHighlight,
        winnerGlow && styles.cardWinnerGlow,
      ]}
      testID={`card-view-${card.id}`}
    >
      {/* Top corner rank and suit */}
      <View style={styles.cardCornerTop}>
        <Text
          style={[
            styles.rank,
            size === "compact" && styles.compactRank,
            red && styles.redColor,
          ]}
        >
          {card.rank}
        </Text>
        <Text
          style={[
            styles.suitIconSmall,
            size === "compact" && styles.compactSuitIcon,
            red && styles.redColor,
          ]}
        >
          {suitSymbol(card.suit)}
        </Text>
      </View>

      {/* Center suit symbol */}
      <Text
        style={[
          styles.centerSuit,
          size === "medium" && styles.mediumCenterSuit,
          size === "compact" && styles.compactCenterSuit,
          red && styles.redColor,
        ]}
      >
        {suitSymbol(card.suit)}
      </Text>

      {/* Bottom corner rank and suit */}
      <View style={styles.cardCornerBottom}>
        <Text
          style={[
            styles.rank,
            size === "compact" && styles.compactRank,
            red && styles.redColor,
          ]}
        >
          {card.rank}
        </Text>
        <Text
          style={[
            styles.suitIconSmall,
            size === "compact" && styles.compactSuitIcon,
            red && styles.redColor,
          ]}
        >
          {suitSymbol(card.suit)}
        </Text>
      </View>
    </View>
  );
}

export function isRedSuit(card: Card): boolean {
  return card.suit === "DIAMONDS" || card.suit === "HEARTS";
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "CLUBS": return "♣";
    case "DIAMONDS": return "♦";
    case "HEARTS": return "♥";
    case "SPADES": return "♠";
  }
}

export function suitArabic(suit: Suit): string {
  switch (suit) {
    case "CLUBS": return "شيريا";
    case "DIAMONDS": return "ديمن";
    case "HEARTS": return "هاص";
    case "SPADES": return "سبيد";
  }
}

const styles = StyleSheet.create({
  card: {
    width: 48,
    height: 68,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mediumCard: {
    width: 44,
    height: 64,
  },
  compactCard: {
    width: 36,
    height: 52,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  cardHighlight: {
    borderColor: "#D4AF37",
    borderWidth: 2,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  cardWinnerGlow: {
    borderColor: "#F59E0B",
    borderWidth: 2.5,
    backgroundColor: "#FFFDF5",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyCardText: {
    color: "#64748B",
    fontSize: 12,
  },
  cardCornerTop: {
    alignSelf: "flex-start",
    alignItems: "center",
  },
  cardCornerBottom: {
    alignSelf: "flex-end",
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
  },
  rank: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 12,
  },
  compactRank: {
    fontSize: 10,
    lineHeight: 10,
  },
  suitIconSmall: {
    color: "#0F172A",
    fontSize: 9,
    lineHeight: 9,
  },
  compactSuitIcon: {
    fontSize: 8,
    lineHeight: 8,
  },
  centerSuit: {
    color: "#0F172A",
    fontSize: 18,
    lineHeight: 18,
  },
  mediumCenterSuit: {
    fontSize: 16,
    lineHeight: 16,
  },
  compactCenterSuit: {
    fontSize: 13,
    lineHeight: 13,
  },
  redColor: {
    color: "#DC2626",
  },
});
