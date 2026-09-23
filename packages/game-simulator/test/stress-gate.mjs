import assert from "node:assert/strict";
import { simulateMatchBatch } from "../dist/index.js";

const games = Math.max(1, Number(process.env.SIMULATION_GAMES ?? "1000"));
const maxRounds = Math.max(1, Number(process.env.SIMULATION_MAX_ROUNDS ?? "40"));

const result = simulateMatchBatch({
  seed: `stress:${games}`,
  games,
  maxRoundsPerGame: maxRounds,
});

assert.equal(result.games, games);
assert.equal(result.illegalActions, 0);
assert.equal(result.maxRoundTerminations, 0);
assert.equal(result.finishedMatches, games);

console.log(JSON.stringify(result));
