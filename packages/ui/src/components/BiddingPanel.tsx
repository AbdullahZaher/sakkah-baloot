import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  BiddingAction,
  BiddingActionOption,
  BiddingActionRecord,
  Card,
  Seat,
  Suit,
} from "@sakkah-baloot/game-engine";

export type BiddingActionType = BiddingAction["type"];

export interface BiddingPanelProps {
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly legalOptions: readonly BiddingActionOption[];
  readonly history?: readonly BiddingActionRecord[] | readonly any[];
  readonly onBiddingAction?: ((action: BiddingActionType, suit?: Suit) => void) | undefined;
  readonly disabled?: boolean;
}

export function BiddingPanel({
  phase,
  exposedCard,
  legalOptions = [],
  history = [],
  onBiddingAction,
  disabled = false,
}: BiddingPanelProps) {
  const [submitting, setSubmitting] = useState(false);

  // Reset submitting state whenever legalOptions change (new turn or updated state)
  useEffect(() => {
    setSubmitting(false);
  }, [legalOptions]);

  const handleAction = (action: BiddingActionType, suit?: Suit) => {
    if (disabled || submitting) return;
    setSubmitting(true);
    onBiddingAction?.(action, suit);
  };

  const hasSun = legalOptions.some((o) => o.type === "BUY_SUN");
  const hasExposedHokum = legalOptions.some((o) => o.type === "BUY_HOKUM_EXPOSED");
  const hasAshkal = legalOptions.some((o) => o.type === "BUY_ASHKAL");
  const hasKasho = legalOptions.some((o) => o.type === "DECLARE_KASHO");
  const hasPass = legalOptions.some((o) => o.type === "PASS");
  const hokumOptions = legalOptions.filter((o) => o.type === "BUY_HOKUM" && o.suit !== undefined);

  const recentHistory = history.slice(-4);

  return (
    <View style={styles.container} testID="bidding-panel">
      {/* Header with Phase & Exposed Card Context */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>قرار المزايدة</Text>
          <Text style={styles.phaseSubtitle}>{formatPhase(phase)}</Text>
        </View>
        {phase === "SECOND_ROUND" && exposedCard ? (
          <View style={styles.exposedCardMini}>
            <Text style={styles.exposedCardLabel}>ورقة المكشوف</Text>
            <Text
              style={[
                styles.exposedCardValue,
                isRedSuit(exposedCard) && styles.redText,
              ]}
            >
              {exposedCard.rank} {suitSymbol(exposedCard.suit)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.guidanceHint}>
        اختر العقد المتاح لك أو مرّر الدور بـ «بس»
      </Text>

      {/* Primary Action Buttons (Sun, Exposed Hokum, Ashkal, Kasho) */}
      <View style={styles.primaryRow}>
        {hasSun ? (
          <BiddingButton
            label="صن"
            actionType="BUY_SUN"
            variant="sun"
            disabled={disabled || submitting}
            onPress={() => handleAction("BUY_SUN")}
            accessibilityLabel="شراء صن"
          />
        ) : null}

        {hasExposedHokum ? (
          <BiddingButton
            label="حكم المكشوف"
            actionType="BUY_HOKUM_EXPOSED"
            variant="hokum"
            disabled={disabled || submitting}
            onPress={() => handleAction("BUY_HOKUM_EXPOSED")}
            accessibilityLabel={`شراء حكم المكشوف ${exposedCard ? suitArabic(exposedCard.suit) : ""}`}
          />
        ) : null}

        {hasAshkal ? (
          <BiddingButton
            label="أشكال"
            actionType="BUY_ASHKAL"
            variant="ashkal"
            disabled={disabled || submitting}
            onPress={() => handleAction("BUY_ASHKAL")}
            accessibilityLabel="شراء أشكال (صن للموزع)"
          />
        ) : null}

        {hasKasho ? (
          <BiddingButton
            label="كاشو"
            actionType="DECLARE_KASHO"
            variant="kasho"
            disabled={disabled || submitting}
            onPress={() => handleAction("DECLARE_KASHO")}
            accessibilityLabel="إعلان كاشو وإلغاء الجولة"
          />
        ) : null}
      </View>

      {/* Second Round Hokum Suit Pickers (Engine-projected options only) */}
      {hokumOptions.length > 0 ? (
        <View style={styles.suitSection}>
          <Text style={styles.suitSectionLabel}>اختر لون الحكم (الجولة الثانية)</Text>
          <View style={styles.suitRow}>
            {hokumOptions.map((opt) => {
              const suit = opt.suit!;
              const isRed = suit === "HEARTS" || suit === "DIAMONDS";
              return (
                <Pressable
                  key={`BUY_HOKUM-${suit}`}
                  accessibilityRole="button"
                  accessibilityLabel={`حكم ${suitArabic(suit)}`}
                  accessibilityHint="اضغط لاختيار لون الحكم"
                  disabled={disabled || submitting}
                  onPress={() => handleAction("BUY_HOKUM", suit)}
                  style={({ pressed }) => [
                    styles.suitButton,
                    (disabled || submitting) && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.suitButtonIcon, isRed && styles.redText]}>
                    {suitSymbol(suit)}
                  </Text>
                  <Text style={styles.suitButtonText}>{suitArabic(suit)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Pass Button */}
      {hasPass ? (
        <View style={styles.passRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تمرير الدور (بس)"
            accessibilityHint="اضغط لتمرير المزايدة"
            disabled={disabled || submitting}
            onPress={() => handleAction("PASS")}
            style={({ pressed }) => [
              styles.passButton,
              (disabled || submitting) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.passButtonText}>بــس</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Recent Bidding History Summary */}
      {recentHistory.length > 0 ? (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>سجل المزايدة في هذه الجولة</Text>
          <View style={styles.historyRows}>
            {recentHistory.map((record) => (
              <View key={record.actionId} style={styles.historyChip}>
                <Text style={styles.historySeat}>{seatArabicName(record.seat)}</Text>
                <Text style={styles.historyAction}>
                  {biddingActionArabic(record.action)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface BiddingButtonProps {
  readonly label: string;
  readonly actionType: BiddingActionType;
  readonly variant: "sun" | "hokum" | "ashkal" | "kasho";
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
}

function BiddingButton({
  label,
  variant,
  disabled,
  onPress,
  accessibilityLabel,
}: BiddingButtonProps) {
  const variantStyle =
    variant === "sun"
      ? styles.sunButton
      : variant === "hokum"
        ? styles.hokumButton
        : variant === "ashkal"
          ? styles.ashkalButton
          : styles.kashoButton;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="اضغط لتأكيد قرار المزايدة"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        variantStyle,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function formatPhase(phase: string): string {
  switch (phase) {
    case "FIRST_ROUND":
      return "الجولة الأولى";
    case "SECOND_ROUND":
      return "الجولة الثانية";
    case "CONTRACT_SELECTED":
      return "تم اختيار العقد";
    case "CANCELLED":
      return "جولة ملغاة";
    default:
      return phase;
  }
}

function isRedSuit(card: Card): boolean {
  return card.suit === "HEARTS" || card.suit === "DIAMONDS";
}

function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "SPADES": return "♠";
    case "HEARTS": return "♥";
    case "DIAMONDS": return "♦";
    case "CLUBS": return "♣";
  }
}

function suitArabic(suit: Suit): string {
  switch (suit) {
    case "SPADES": return "سبيد";
    case "HEARTS": return "هارت";
    case "DIAMONDS": return "ديمن";
    case "CLUBS": return "كلوب";
  }
}

function seatArabicName(seat: Seat): string {
  switch (seat) {
    case "NORTH": return "الشمال";
    case "EAST": return "الشرق";
    case "SOUTH": return "الجنوب";
    case "WEST": return "الغرب";
  }
}

function biddingActionArabic(action: BiddingActionType): string {
  switch (action) {
    case "PASS": return "بس";
    case "BUY_SUN": return "صن";
    case "BUY_HOKUM_EXPOSED": return "حكم المكشوف";
    case "BUY_HOKUM": return "حكم";
    case "BUY_ASHKAL": return "أشكال";
    case "DECLARE_KASHO": return "كاشو";
  }
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    maxWidth: "96%",
    alignSelf: "center",
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(5, 18, 14, 0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.45)",
    gap: 6,
    zIndex: 30,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#F5E6BF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  phaseSubtitle: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 1,
  },
  exposedCardMini: {
    minWidth: 48,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    alignItems: "center",
  },
  exposedCardLabel: {
    color: "#D8C28A",
    fontSize: 7,
    fontWeight: "700",
  },
  exposedCardValue: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },
  guidanceHint: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  primaryButton: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  sunButton: {
    backgroundColor: "#B45309",
    borderColor: "#FCD34D",
  },
  hokumButton: {
    backgroundColor: "#047857",
    borderColor: "#6EE7B7",
  },
  ashkalButton: {
    backgroundColor: "#4338CA",
    borderColor: "#A5B4FC",
  },
  kashoButton: {
    backgroundColor: "#6D28D9",
    borderColor: "#DDD6FE",
  },
  suitSection: {
    gap: 4,
    marginTop: 2,
  },
  suitSectionLabel: {
    color: "#D8C28A",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  suitRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  suitButton: {
    minWidth: 62,
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#134E4A",
    borderWidth: 1.5,
    borderColor: "#2DD4BF",
  },
  suitButtonIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  suitButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  passRow: {
    alignItems: "center",
    marginTop: 2,
  },
  passButton: {
    width: "100%",
    maxWidth: 220,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  passButtonText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  redText: {
    color: "#EF4444",
  },
  historyContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  historyTitle: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  historyRows: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  historyChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  historySeat: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "700",
  },
  historyAction: {
    color: "#FDE68A",
    fontSize: 8,
    fontWeight: "900",
  },
});
