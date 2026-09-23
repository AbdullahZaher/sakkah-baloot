import test from "node:test";
import assert from "node:assert/strict";
import { createCardMemory, extractStrategyFeatures } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

test("card memory tracks known cards and high-impact trump", () => {
  const hand = ["HEARTS-J", "HEARTS-9", "HEARTS-A", "CLUBS-A"].map(card);
  const memory = createCardMemory({
    ownHand: hand,
    exposedCard: card("SPADES-10"),
    contract: "HOKUM",
    trumpSuit: "HEARTS",
  });

  assert.equal(memory.knownCards.size, 5);
  assert.equal(memory.remainingCards.length, 27);
  assert.equal(memory.remainingTrump.length, 5);
  assert.equal(memory.remainingTrump.some((c) => c.id === "HEARTS-J"), false);
  assert.equal(memory.remainingTrump.some((c) => c.id === "HEARTS-Q"), true);
});

test("strategy features identify partner-winning trick and minimum winning card", () => {
  const hand = ["HEARTS-A", "HEARTS-10", "CLUBS-7"].map(card);
  const memory = createCardMemory({
    ownHand: hand,
    contract: "HOKUM",
    trumpSuit: "HEARTS",
    currentTrick: [
      { seat: "NORTH", card: card("CLUBS-A") },
      { seat: "EAST", card: card("CLUBS-7") },
    ],
  });

  const features = extractStrategyFeatures({
    ownHand: hand,
    memory,
    contract: "HOKUM",
    trumpSuit: "HEARTS",
    playerSeat: "SOUTH",
    currentTrick: [
      { seat: "NORTH", card: card("CLUBS-A") },
      { seat: "EAST", card: card("CLUBS-7") },
    ],
  });

  assert.equal(features.partnerWinning, true);
  assert.equal(features.currentTrickWinning, false);
  assert.deepEqual(features.minimumWinningCardIds, ["HEARTS-10"]);
  assert.equal(features.trumpControlCount, 0);
  assert.equal(features.voidSuits.includes("DIAMONDS"), true);
});
