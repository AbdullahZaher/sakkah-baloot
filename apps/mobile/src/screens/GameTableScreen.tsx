import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { createLocalBiddingSession, type LocalBiddingSession } from "@sakkah-baloot/game-client";
import { GameTable } from "@sakkah-baloot/ui";

export function GameTableScreen() {
  const [session] = useState<LocalBiddingSession>(createLocalBiddingSession);
  const [preview, setPreview] = useState(() => session.getSnapshot());

  return (
    <View style={styles.root}>
      <GameTable
        dealerSeat={preview.dealerSeat}
        actingSeat={preview.bidding.actingSeat}
        phase={preview.bidding.phase}
        exposedCard={preview.exposedCard}
        hand={preview.playerHand}
        legalActions={preview.legalActions}
        playerSeat={preview.playerSeat}
        onBiddingAction={(action, suit) => setPreview(session.dispatchBiddingAction(action, suit))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07120F" },
});
