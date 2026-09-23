import test from "node:test";
import assert from "node:assert/strict";
import { createHumanVsAIController } from "../dist/index.js";

function config() {
  return {
    humanPlayerId: "HUMAN",
    aiPlayers: {
      AI_EAST: { seat: "EAST", config: { mode: "BASELINE", seed: "east" } },
      AI_SOUTH: { seat: "SOUTH", config: { mode: "BASELINE", seed: "south" } },
      AI_WEST: { seat: "WEST", config: { mode: "BASELINE", seed: "west" } },
    },
  };
}

test("human-vs-3-AI controller enforces exactly three AI players", () => {
  const controller = createHumanVsAIController(config());
  const result = controller.decide({
    matchId: "match",
    roundId: "round",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "ROUND_ACTIVE",
    stateVersion: 7,
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    lastRoundScore: null,
    end: { status: "ONGOING", score: { NORTH_SOUTH: 0, EAST_WEST: 0 } },
    round: null,
  });

  assert.equal(result.kind, "HUMAN");
  assert.equal(result.playerId, "HUMAN");
  assert.equal(result.expectedStateVersion, 7);
});

test("human player cannot also be an AI", () => {
  assert.throws(
    () =>
      createHumanVsAIController({
        ...config(),
        aiPlayers: {
          ...config().aiPlayers,
          HUMAN: { seat: "NORTH", config: { mode: "BASELINE", seed: "human" } },
        },
      }),
    /Human player cannot also be configured as AI/,
  );
});
