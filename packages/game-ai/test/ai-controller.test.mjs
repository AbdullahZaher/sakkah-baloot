import test from "node:test";
import assert from "node:assert/strict";
import { decideAIAction } from "../dist/index.js";

test("AI controller baseline mode returns a typed action", () => {
  const observation = {
    matchId: "m",
    roundId: "r",
    roundNumber: 1,
    playerId: "P1",
    seat: "NORTH",
    teamId: "NORTH_SOUTH",
    phase: "PLAYING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: null,
    playing: {
      phase: "PLAYING",
      contract: "SUN",
      trumpSuit: null,
      game: {
        phase: "PLAYING",
        currentPlayerId: "P1",
        players: { P1: "NORTH" },
        ownHand: [{ id: "SPADES-A", suit: "SPADES", rank: "A" }],
        knownPlayedCards: [],
        legalCardIds: ["SPADES-A"],
        contract: "SUN",
        trumpSuit: null,
        hokumPlayMode: "OPEN",
        dealerSeat: "NORTH",
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
      },
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  };

  const result = decideAIAction(observation, {
    mode: "BASELINE",
    seed: "controller-test",
  });

  assert.deepEqual(result.action, {
    type: "PLAY_CARD",
    cardId: "SPADES-A",
  });
  assert.equal(result.mode, "BASELINE");
});
