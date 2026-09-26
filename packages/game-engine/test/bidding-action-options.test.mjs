import test from "node:test";
import assert from "node:assert/strict";

import {
  createBiddingState,
  legalBiddingActionOptions,
  legalBiddingActions,
} from "../dist/index.js";

const hands = {
  NORTH: ["HEARTS-7", "HEARTS-8", "HEARTS-9", "HEARTS-10", "HEARTS-J"],
  EAST: ["CLUBS-A", "CLUBS-K", "CLUBS-Q", "CLUBS-J", "CLUBS-10"],
  SOUTH: ["DIAMONDS-7", "DIAMONDS-8", "DIAMONDS-9", "DIAMONDS-10", "DIAMONDS-J"],
  WEST: ["SPADES-A", "SPADES-8", "SPADES-9", "SPADES-10", "SPADES-J"],
};

test("first-round legal bidding action options include exposed-suit Hokum", () => {
  const state = createBiddingState("test-round-1", "NORTH");
  const options = legalBiddingActionOptions(state, "NORTH", "HEARTS", hands);

  assert.deepEqual(options, [
    { type: "PASS" },
    { type: "BUY_HOKUM_EXPOSED", suit: "HEARTS" },
    { type: "BUY_SUN" },
  ]);

  const legacyActions = legalBiddingActions(state, "NORTH", "HEARTS", hands);
  assert.deepEqual(legacyActions, ["PASS", "BUY_HOKUM_EXPOSED", "BUY_SUN"]);
});

test("first-round legal options include BUY_ASHKAL for eligible dealer/partner seats", () => {
  const state = {
    ...createBiddingState("test-round-1", "NORTH"),
    actingSeat: "NORTH",
  };
  const options = legalBiddingActionOptions(state, "NORTH", "DIAMONDS", hands);

  assert.deepEqual(options, [
    { type: "PASS" },
    { type: "BUY_HOKUM_EXPOSED", suit: "DIAMONDS" },
    { type: "BUY_SUN" },
    { type: "BUY_ASHKAL" },
  ]);
});

test("second-round legal options exclude exposed suit and offer all alternate suits", () => {
  const state = {
    ...createBiddingState("test-round-1", "NORTH"),
    actingSeat: "SOUTH",
    phase: "SECOND_ROUND",
    turnNumber: 4,
    passCount: 4,
  };

  const options = legalBiddingActionOptions(state, "NORTH", "HEARTS", hands);

  assert.deepEqual(options, [
    { type: "PASS" },
    { type: "BUY_HOKUM", suit: "CLUBS" },
    { type: "BUY_HOKUM", suit: "DIAMONDS" },
    { type: "BUY_HOKUM", suit: "SPADES" },
  ]);
});

test("second-round dealer-right with Ace includes BUY_SUN", () => {
  const state = {
    ...createBiddingState("test-round-1", "NORTH"), // dealer NORTH -> counter-clockwise next is WEST
    actingSeat: "WEST",
    phase: "SECOND_ROUND",
    turnNumber: 4,
    passCount: 4,
  };

  const options = legalBiddingActionOptions(state, "NORTH", "SPADES", hands);

  assert.deepEqual(options, [
    { type: "PASS" },
    { type: "BUY_SUN" },
    { type: "BUY_HOKUM", suit: "CLUBS" },
    { type: "BUY_HOKUM", suit: "DIAMONDS" },
    { type: "BUY_HOKUM", suit: "HEARTS" },
  ]);
});

test("terminal phases return empty action options", () => {
  const selectedState = {
    ...createBiddingState("test-round-1", "NORTH"),
    phase: "CONTRACT_SELECTED",
  };
  assert.deepEqual(legalBiddingActionOptions(selectedState, "NORTH", "HEARTS", hands), []);

  const cancelledState = {
    ...createBiddingState("test-round-1", "NORTH"),
    phase: "CANCELLED",
  };
  assert.deepEqual(legalBiddingActionOptions(cancelledState, "NORTH", "HEARTS", hands), []);
});

test("legalBiddingActionOptions is deterministic and does not mutate hands or state", () => {
  const state = createBiddingState("test-round-1", "NORTH");
  const originalState = JSON.stringify(state);
  const originalHands = JSON.stringify(hands);

  const first = legalBiddingActionOptions(state, "NORTH", "CLUBS", hands);
  const second = legalBiddingActionOptions(state, "NORTH", "CLUBS", hands);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(state), originalState);
  assert.equal(JSON.stringify(hands), originalHands);
});
