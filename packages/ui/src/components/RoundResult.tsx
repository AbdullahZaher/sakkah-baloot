import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  MatchEndResult,
  MatchScore,
  RoundScoreBreakdown,
} from "@sakkah-baloot/game-engine";

export interface RoundResultProps {
  readonly score: RoundScoreBreakdown;
  readonly matchScore: MatchScore;
  readonly matchEnd: MatchEndResult;
  readonly onNextRound?: (() => void) | undefined;
}

export function RoundResult({
  score,
  matchScore,
  matchEnd,
  onNextRound,
}: RoundResultProps) {
  const isFinished = matchEnd.status === "FINISHED";
  const isExtraDeal = matchEnd.status === "EXTRA_DEAL";
  const canContinue = !isFinished;

  const isLanaWinner = matchEnd.status === "FINISHED" && matchEnd.winnerTeamId === "NORTH_SOUTH";

  return (
    <View style={styles.resultCard} testID="round-result-card">
      <Text style={styles.resultTitle}>نتيجة الجولة</Text>

      {/* 2-Column Comparison Table (Lana vs Lahum) */}
      <View style={styles.resultGrid}>
        {/* Lana Column */}
        <View style={[styles.resultCol, styles.colLana]}>
          <Text style={[styles.resultColHeader, styles.textLana]}>
            لنا (شمال + جنوب)
          </Text>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>الأبناط:</Text>
            <Text style={styles.resultRowValue}>{score.cardRaw.NORTH_SOUTH}</Text>
          </View>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>المشاريع:</Text>
            <Text style={styles.resultRowValue}>{score.projectQaid.NORTH_SOUTH}</Text>
          </View>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>البلوت:</Text>
            <Text style={styles.resultRowValue}>{score.balootQaid.NORTH_SOUTH}</Text>
          </View>
          <View style={[styles.resultRowItem, styles.qaidTotalRow]}>
            <Text style={styles.resultQaidTotalLabel}>القيد:</Text>
            <Text style={[styles.resultQaidTotalValue, styles.textLana]}>
              {score.finalQaid.NORTH_SOUTH}
            </Text>
          </View>
        </View>

        <View style={styles.resultDivider} />

        {/* Lahum Column */}
        <View style={[styles.resultCol, styles.colLahum]}>
          <Text style={[styles.resultColHeader, styles.textLahum]}>
            لهم (شرق + غرب)
          </Text>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>الأبناط:</Text>
            <Text style={styles.resultRowValue}>{score.cardRaw.EAST_WEST}</Text>
          </View>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>المشاريع:</Text>
            <Text style={styles.resultRowValue}>{score.projectQaid.EAST_WEST}</Text>
          </View>
          <View style={styles.resultRowItem}>
            <Text style={styles.resultRowLabel}>البلوت:</Text>
            <Text style={styles.resultRowValue}>{score.balootQaid.EAST_WEST}</Text>
          </View>
          <View style={[styles.resultRowItem, styles.qaidTotalRow]}>
            <Text style={styles.resultQaidTotalLabel}>القيد:</Text>
            <Text style={[styles.resultQaidTotalValue, styles.textLahum]}>
              {score.finalQaid.EAST_WEST}
            </Text>
          </View>
        </View>
      </View>

      {/* Special Outcome Badges (Kaboot & Reverse Kaboot) */}
      {score.kabootTeamId ? (
        <View style={styles.badgeKaboot}>
          <Text style={styles.badgeKabootText}>
            🔥 كابوت لصالح: {score.kabootTeamId === "NORTH_SOUTH" ? "لنا" : "لهم"}
          </Text>
        </View>
      ) : null}

      {score.reverseKaboot ? (
        <View style={styles.badgeReverse}>
          <Text style={styles.badgeReverseText}>⚡ ريبيرس كابوت (+88 قيد)</Text>
        </View>
      ) : null}

      {/* Cumulative Match Score Bar */}
      <View style={styles.matchScoreBar}>
        <Text style={styles.matchScoreLabel}>الصكّة:</Text>
        <Text style={styles.matchScoreNumbers}>
          {matchScore.NORTH_SOUTH} لنا — {matchScore.EAST_WEST} لهم
        </Text>
      </View>

      {/* Match Finish Banner */}
      {isFinished ? (
        <View
          style={[
            styles.matchFinishedBanner,
            isLanaWinner ? styles.matchWonLana : styles.matchWonLahum,
          ]}
        >
          <Text style={styles.matchFinishedTitle}>
            {isLanaWinner ? "🏆 مبروك! فاز فريق لنا بالصكة" : "انتهت الصكّة — فاز فريق لهم"}
          </Text>
        </View>
      ) : null}

      {/* Extra Deal Banner */}
      {isExtraDeal ? (
        <View style={styles.extraDealBanner}>
          <Text style={styles.extraDealText}>تعادل — توزيع إضافي لحسم الصكة</Text>
        </View>
      ) : null}

      {/* Next Round Button */}
      {canContinue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExtraDeal ? "بدء التوزيع الإضافي" : "بدء الجولة التالية"}
          accessibilityHint="اضغط للانتقال إلى الجولة التالية وتوزيع الأوراق"
          onPress={onNextRound}
          style={({ pressed }) => [
            styles.nextRoundBtn,
            pressed && styles.nextRoundBtnPressed,
          ]}
        >
          <Text style={styles.nextRoundBtnText}>
            {isExtraDeal ? "توزيع إضافي" : "الجولة التالية"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    minWidth: 280,
    maxWidth: 340,
    width: "92%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(5, 18, 14, 0.98)",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    gap: 8,
    alignSelf: "center",
    zIndex: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  resultTitle: {
    color: "#F5E6BF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  resultGrid: {
    flexDirection: "row-reverse",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 8,
  },
  resultCol: {
    flex: 1,
    gap: 4,
  },
  colLana: {
    paddingLeft: 4,
  },
  colLahum: {
    paddingRight: 4,
  },
  resultColHeader: {
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  textLana: {
    color: "#34D399",
  },
  textLahum: {
    color: "#F87171",
  },
  resultRowItem: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  resultRowLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },
  resultRowValue: {
    color: "#F8FAFC",
    fontSize: 9,
    fontWeight: "800",
  },
  qaidTotalRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  resultQaidTotalLabel: {
    color: "#F5E6BF",
    fontSize: 10,
    fontWeight: "900",
  },
  resultQaidTotalValue: {
    fontSize: 11,
    fontWeight: "900",
  },
  resultDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginHorizontal: 6,
  },
  badgeKaboot: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  badgeKabootText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },
  badgeReverse: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  badgeReverseText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "900",
  },
  matchScoreBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  matchScoreLabel: {
    color: "#D8C28A",
    fontSize: 10,
    fontWeight: "800",
  },
  matchScoreNumbers: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  matchFinishedBanner: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  matchWonLana: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  matchWonLahum: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  matchFinishedTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  extraDealBanner: {
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(217, 119, 6, 0.2)",
    borderWidth: 1,
    borderColor: "#D97706",
    alignItems: "center",
  },
  extraDealText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "800",
  },
  nextRoundBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  nextRoundBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextRoundBtnText: {
    color: "#05130E",
    fontSize: 13,
    fontWeight: "900",
  },
});
