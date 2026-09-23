import { StatusBar } from "expo-status-bar";
import { GameTableScreen } from "./src/screens/GameTableScreen.js";

export default function App() {
  return (
    <>
      <StatusBar hidden />
      <GameTableScreen />
    </>
  );
}
