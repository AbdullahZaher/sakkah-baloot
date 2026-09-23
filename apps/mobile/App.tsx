import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { GameTableScreen } from "./src/screens/GameTableScreen.js";

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <GameTableScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#07120F",
  },
});
