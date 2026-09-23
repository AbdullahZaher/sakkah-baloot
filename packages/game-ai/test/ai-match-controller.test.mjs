import test from "node:test";
import assert from "node:assert/strict";
import { chooseAuthoritativeAIAction } from "../dist/index.js";

function playingMatch() {
  const cards = (ids) => ids.map((id) => {
    const [suit, rank] = id.split("-");
    return { id, suit, rank };
  });

  const hands = {
    NORTH: cards(["CLUBS-A"]),
    EAST: cards(["DIAMONDS-7"]),
    SOUTH: cards(["HEARTS-A"]),
    WEST: cards(["SPADES-7"]),
  };

  return {
    matchId: "match-ai",
    roundId: "round-ai",
    roundNumber: 1,
    dealerSeat: "WEST",
    phase: "ROUND_ACTIVE",
    stateVersion: 1,
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    lastRoundScore: null,
    end: { status: "ONGOING", score: { NORTH_SOUTH: 0, EAST_WEST: 0 } },
    round: {
      roundId: "round-ai",
      roundNumber: 1,
      dealerSeat: "WEST",
      phase: "PLAYING",
      deal: {
        roundId: "round-ai",
        dealerSeat: "WEST",
        hands: {
          NORTH: ["CLUBS-A"],
          EAST: ["DIAMONDS-7"],
          SOUTH: ["HEARTS-A"],
          WEST: ["SPADES-7"],
        },
        exposedCardId: null,
        transcript: { initialHands: { NORTH: ["CLUBS-A"], EAST: ["DIAMONDS-7"], SOUTH: ["HEARTS-A"], WEST: ["SPADES-7"] } },
      },
      bidding: { roundId: "round-ai", phase: "CONTRACT_SELECTED", history: [], selectedContract: { contract: "SUN", trumpSuit: null, purchaserSeat: "NORTH", exposedCardReceiverSeat: "EAST" } },
      game: {
        phase: "PLAYING",
        currentPlayerId: "NORTH_PLAYER",
        players: {
          NORTH_PLAYER: "NORTH",
          EAST_PLAYER: "EAST",
          SOUTH_PLAYER: "SOUTH",
          WEST_PLAYER: "WEST",
        },
        hands: {
          NORTH_PLAYER: hands.NORTH,
          EAST_PLAYER: hands.EAST,
          SOUTH_PLAYER: hands.SOUTH,
          WEST_PLAYER: hands.WEST,
        },
        contract: "SUN",
        trumpSuit: null,
        hokumPlayMode: "OPEN",
        dealerSeat: "WEST",
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
      },
      projects: [],
      baloot: null,
      score: null,
    },
  };
}

test("authoritative AI controller only returns a legal card", () => {
  const match = playingMatch();
  const decision = chooseAuthoritativeAIAction(
    match,
    "NORTH_PLAYER",
    "NORTH",
    { seed: "controller", mode: "BASELINE" },
  );

  assert.equal(decision.reason, "CARD");
  assert.equal(decision.action.type, "PLAY_CARD");
  assert.equal(decision.action.cardId, "CLUBS-A");
});

test("authoritative AI controller is deterministic", () => {
  const match = playingMatch();
  const config = { seed: "controller", mode: "IS_MCTS", mctsIterations: 4 };
  const a = chooseAuthoritativeAIAction(match, "NORTH_PLAYER", "NORTH", config);
  const b = chooseAuthoritativeAIAction(match, "NORTH_PLAYER", "NORTH", config);

  assert.deepEqual(a.action, b.action);
});
