import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  createLocalHumanVsAISession,
  type LocalPlayableSession,
} from "@sakkah-baloot/game-client";
import { GameTable } from "@sakkah-baloot/ui";

export function GameTableScreen() {
  const [session] = useState<LocalPlayableSession>(() =>
    createLocalHumanVsAISession({
      seed: "local-human-vs-ai",
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>صكّة بلوت</Text>
          <Text style={styles.subtitle}>
            أنت الجنوب • 3 لاعبين بالذكاء الاصطناعي
          </Text>
        </View>
        <View style={styles.status}>
          <Text style={styles.statusText}>
            {preview.humanTurn ? "دورك" : `دور ${seatLabel(preview.actingSeat)}`}
          </Text>
          <Text style={styles.version}>v{preview.protocol.stateVersion}</Text>
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
    backgroundColor: "#07120F",
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#F5E7C8",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#AEBDB6",
    marginTop: 3,
    fontSize: 12,
  },
  status: {
    alignItems: "flex-end",
  },
  statusText: {
    color: "#D8B56A",
    fontWeight: "800",
  },
  version: {
    color: "#64736D",
    fontSize: 10,
    marginTop: 2,
  },
  error: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#3B1717",
  },
  errorText: {
    color: "#FFD0D0",
    textAlign: "center",
  },
});
