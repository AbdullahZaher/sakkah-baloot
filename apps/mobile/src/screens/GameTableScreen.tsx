import { StyleSheet, View } from "react-native";
import { GameTable } from "@sakkah-baloot/ui";
import { createLocalPreview } from "@sakkah-baloot/game-client";

export function GameTableScreen() {
  const preview = createLocalPreview();

  return (
    <View style={styles.root}>
      <GameTable
        dealerSeat={preview.dealerSeat}
        actingSeat={preview.bidding.actingSeat}
        phase={preview.bidding.phase}
        exposedCardId={preview.deal.exposedCardId}
        hand={preview.playerHand}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07120F" },
});
