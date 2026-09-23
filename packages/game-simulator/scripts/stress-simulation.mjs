import { simulateMatchBatch } from "../src/index.ts";

const games = Number(process.env.SIMULATION_GAMES ?? 1000);
const result = simulateMatchBatch({
  seed: process.env.SIMULATION_SEED ?? "phase-18-stress",
  games,
  maxRoundsPerGame: 100,
});

if (result.illegalActions !== 0) throw new Error("Stress simulation produced illegal actions");
if (result.games !== games) throw new Error("Stress simulation game count mismatch");
console.log(JSON.stringify(result));
