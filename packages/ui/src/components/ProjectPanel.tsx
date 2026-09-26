import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  CardId,
  ProjectCandidate,
  ProjectDeclaration,
  Suit,
} from "@sakkah-baloot/game-engine";
import { suitSymbol } from "./CardView";

export interface ProjectPanelProps {
  readonly candidates: readonly ProjectCandidate[];
  readonly declared: readonly ProjectDeclaration[];
  readonly onProject?: ((projectId: string) => void) | undefined;
}

export function ProjectPanel({
  candidates,
  declared,
  onProject,
}: ProjectPanelProps) {
  const declaredIds = new Set(declared.map((item) => item.candidate.id));
  const available = candidates.filter((candidate) => !declaredIds.has(candidate.id));
  if (available.length === 0) return null;

  return (
    <View style={styles.projectPanel} testID="project-panel">
      <View style={styles.projectHeaderRow}>
        <Text style={styles.projectTitle}>إعلان المشاريع المتاحة</Text>
      </View>
      <View style={styles.projectChoices}>
        {available.map((candidate) => (
          <Pressable
            key={candidate.id}
            accessibilityRole="button"
            accessibilityLabel={`إعلان مشروع ${projectLabel(candidate.type)} بقيمة ${candidate.qaydValue} قيد`}
            accessibilityHint="اضغط لتأكيد إعلان المشروع في الأكلة الأولى"
            onPress={() => onProject?.(candidate.id)}
            disabled={!onProject}
            style={({ pressed }) => [
              styles.projectChoice,
              pressed && styles.projectChoicePressed,
            ]}
          >
            <Text style={styles.projectChoiceTitle}>
              {projectLabel(candidate.type)} (+{candidate.qaydValue} قيد)
            </Text>
            <Text style={styles.projectChoiceCards}>
              {formatProjectCards(candidate.cards)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function projectLabel(type: ProjectCandidate["type"]): string {
  switch (type) {
    case "SERA": return "سِرَا";
    case "FIFTY": return "خمسين";
    case "HUNDRED": return "مية";
    case "FOUR_HUNDRED": return "أربعمية";
  }
}

export function formatProjectCards(cards: readonly CardId[]): string {
  return cards
    .map((id) => {
      const [suit, rank] = id.split("-");
      return suit && rank ? `${rank}${suitSymbol(suit as Suit)}` : id;
    })
    .join(" ");
}

const styles = StyleSheet.create({
  projectPanel: {
    backgroundColor: "rgba(5, 18, 14, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.6)",
    marginBottom: 6,
    alignItems: "center",
    zIndex: 30,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  projectHeaderRow: {
    marginBottom: 4,
  },
  projectTitle: {
    color: "#F5E6BF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  projectChoices: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  projectChoice: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#38BDF8",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  projectChoicePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  projectChoiceTitle: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
  },
  projectChoiceCards: {
    color: "#F8FAFC",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1,
  },
});
