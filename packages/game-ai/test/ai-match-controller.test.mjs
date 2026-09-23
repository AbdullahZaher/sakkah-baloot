import test from "node:test";
import assert from "node:assert/strict";
import { chooseAuthoritativeAIAction } from "../dist/index.js";

function playingMatch() {
  const cards = (ids) => ids.map((id) => {
    const [suit, rank] = id.split("-");
    return { id, suit, rank };
  });

  const suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const fullDeck = suits.flatMap((suit) => ranks.map((rank) => `${suit}-${rank}`));
  const hands = {
    NORTH: cards(fullDeck.filter((_, index) => index % 4 === 0)),
    EAST: cards(fullDeck.filter((_, index) => index % 4 === 1)),
    SOUTH: cards(fullDeck.filter((_, index) => index % 4 === 2)),
    WEST: cards(fullDeck.filter((_, index) => index % 4 === 3)),
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
          NORTH: hands.NORTH.map((card) => card.id),
          EAST: hands.EAST.map((card) => card.id),
          SOUTH: hands.SOUTH.map((card) => card.id),
          WEST: hands.WEST.map((card) => card.id),
        },
        exposedCardId: null,
        transcript: { initialHands: {
          NORTH: fullDeck.slice(0, 8),
          EAST: fullDeck.slice(8, 16),
          SOUTH: fullDeck.slice(16, 24),
          WEST: fullDeck.slice(24, 32),
        } },
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
  assert.equal(match.round.game.hands.NORTH_PLAYER.some((card) => card.id === decision.action.cardId), true);
});

test("authoritative AI controller is deterministic", () => {
  const match = playingMatch();
  const config = { seed: "controller", mode: "IS_MCTS", mctsIterations: 4 };
  const a = chooseAuthoritativeAIAction(match, "NORTH_PLAYER", "NORTH", config);
  const b = chooseAuthoritativeAIAction(match, "NORTH_PLAYER", "NORTH", config);

  assert.deepEqual(a.action, b.action);
});
