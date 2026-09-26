import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  createLocalHumanVsAISession,
  type LocalPlayableSession,
} from "@sakkah-baloot/game-client";
import { GameTable } from "@sakkah-baloot/ui";

export function GameTableScreen() {
  const [session] = useState<LocalPlayableSession>(() =>
    createLocalHumanVsAISession({
      // No seed — each session gets a genuinely random deal.
      // Tests/simulator should pass an explicit seed string for reproducibility.
      humanSeat: "SOUTH",
      aiMode: "BASELINE",
      aiDifficulty: "NORMAL",
    }),
  );
  const [preview, setPreview] = useState(() => session.getSnapshot());
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => ReturnType<LocalPlayableSession["getSnapshot"]>) => {
    try {
      setError(null);
      setPreview(action());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع");
    }
  };

  // Orchestrate the 2000ms completed trick presentation boundary
  useEffect(() => {
    if (preview.completedTrickPresentation) {
      const timer = setTimeout(() => {
        run(() => session.acknowledgeCompletedTrick());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [preview.completedTrickPresentation, session]);

  const matchScore = preview.matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 };

  return (
    <View style={styles.root}>
      {/* Top Compact HUD Header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>صكّة بلوت</Text>
        </View>

        {/* Match Scores: Lana vs Lahum */}
        <View style={styles.scoreHud}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabelLana}>لنا</Text>
            <Text style={styles.scoreNumberLana}>{matchScore.NORTH_SOUTH}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumberLahum}>{matchScore.EAST_WEST}</Text>
            <Text style={styles.scoreLabelLahum}>لهم</Text>
          </View>
        </View>

        {/* Turn & Status Indicator */}
        <View style={styles.status}>
          <View
            style={[
              styles.turnBadge,
              preview.completedTrickPresentation || preview.roundScore
                ? styles.turnBadgeFrozen
                : preview.humanTurn
                  ? styles.turnBadgeHuman
                  : styles.turnBadgeAi,
            ]}
          >
            <View
              style={[
                styles.turnDot,
                preview.completedTrickPresentation
                  ? styles.turnDotFrozen
                  : preview.humanTurn
                    ? styles.turnDotHuman
                    : styles.turnDotAi,
              ]}
            />
            <Text style={styles.turnBadgeText}>
              {preview.completedTrickPresentation
                ? `فاز ${seatLabel(preview.completedTrickPresentation.winnerSeat)}`
                : preview.roundScore
                  ? preview.matchEnd.status === "FINISHED"
                    ? "انتهت الصكة"
                    : "انتهت الجولة"
                  : preview.humanTurn
                    ? "دورك"
                    : `دور ${seatLabel(preview.actingSeat)}`}
            </Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <GameTable
        dealerSeat={preview.dealerSeat}
        actingSeat={preview.actingSeat}
        phase={preview.bidding.phase}
        exposedCard={preview.exposedCard}
        hand={preview.playerHand}
        legalActions={preview.humanTurn ? preview.legalActions : []}
        legalOptions={preview.humanTurn && preview.biddingPresentation ? preview.biddingPresentation.legalOptions : []}
        biddingHistory={preview.bidding.history}
        legalCardIds={preview.humanTurn ? preview.legalCardIds : []}
        game={preview.game}
        playerSeat={preview.playerSeat}
        onBiddingAction={(action, suit) =>
          run(() => session.dispatchBiddingAction(action, suit))
        }
        onCardPlay={(cardId) =>
          run(() => session.dispatchCardPlay(cardId))
        }
        onNextRound={() => run(() => session.advanceRound())}
        roundScore={preview.roundScore}
        matchScore={preview.matchScore}
        matchEnd={preview.matchEnd}
        contract={preview.game?.contract ?? null}
        trumpSuit={preview.game?.trumpSuit ?? null}
        selectedContract={preview.bidding.selectedContract}
        projectCandidates={preview.projectCandidates}
        declaredProjects={preview.projects}
        baloot={preview.baloot}
        onProject={(projectId) => run(() => session.dispatchProject(projectId))}
        completedTrickPresentation={preview.completedTrickPresentation}
        actionFeedback={preview.actionFeedback}
      />
    </View>
  );
}

function seatLabel(seat: string): string {
  switch (seat) {
    case "NORTH":
      return "الشمال";
    case "EAST":
      return "الشرق";
    case "WEST":
      return "الغرب";
    case "SOUTH":
      return "الجنوب";
    default:
      return seat;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05130E",
  },
  header: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(10, 30, 22, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "#F5E7C8",
    fontSize: 15,
    fontWeight: "900",
  },
  scoreHud: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    gap: 6,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreLabelLana: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  scoreNumberLana: {
    color: "#34D399",
    fontSize: 14,
    fontWeight: "900",
  },
  scoreDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  scoreLabelLahum: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "800",
  },
  scoreNumberLahum: {
    color: "#F87171",
    fontSize: 14,
    fontWeight: "900",
  },
  status: {
    alignItems: "flex-end",
  },
  turnBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  turnBadgeHuman: {
    backgroundColor: "rgba(212, 175, 55, 0.18)",
    borderColor: "#D4AF37",
  },
  turnBadgeAi: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  turnBadgeFrozen: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderColor: "#F59E0B",
  },
  turnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  turnDotHuman: {
    backgroundColor: "#34D399",
  },
  turnDotAi: {
    backgroundColor: "#94A3B8",
  },
  turnDotFrozen: {
    backgroundColor: "#F59E0B",
  },
  turnBadgeText: {
    color: "#F5E6BF",
    fontSize: 10,
    fontWeight: "800",
  },
  error: {
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
