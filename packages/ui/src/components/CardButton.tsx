import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { Card, CardId } from "@sakkah-baloot/game-engine";
import { CardView, suitArabic } from "./CardView";

export interface CardButtonProps {
  readonly card: Card;
  readonly enabled: boolean;
  readonly index: number;
  readonly total: number;
  readonly onPress?: ((cardId: CardId) => void) | undefined;
}

export function CardButton({
  card,
  enabled,
  index,
  total,
  onPress,
}: CardButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  const offset = index - (total - 1) / 2;
  const rotation = `${offset * 2.2}deg`;
  const translateY = enabled ? -12 : 0;

  const handlePress = () => {
    if (!enabled || submitting) return;
    setSubmitting(true);
    try {
      onPress?.(card.id);
    } finally {
      // Release lock on next frame/render cycle
      setTimeout(() => setSubmitting(false), 300);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`ورقة ${card.rank} ${suitArabic(card.suit)}`}
      accessibilityHint={
        enabled
          ? "اضغط للعب هذه الورقة"
          : "هذه الورقة غير قانونية في الدور الحالي"
      }
      accessibilityState={{ disabled: !enabled || submitting }}
      disabled={!enabled || submitting}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.cardButton,
        {
          transform: [
            { rotate: rotation },
            { translateY: pressed && enabled ? -18 : translateY },
          ],
        },
        enabled ? styles.cardEnabled : styles.cardDisabled,
        pressed && enabled ? styles.cardPressed : null,
      ]}
      testID={`card-button-${card.id}`}
    >
      <CardView card={card} highlight={enabled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardButton: {
    marginHorizontal: -6,
    minWidth: 44,
    minHeight: 68,
  },
  cardEnabled: {
    opacity: 1,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardPressed: {
    opacity: 0.9,
  },
});
