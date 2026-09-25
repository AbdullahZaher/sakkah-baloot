import test from "node:test";
import assert from "node:assert/strict";
import {
  applyBiddingAction,
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  legalBiddingActions,
} from "@sakkah-baloot/game-engine";
import { rankBiddingContracts } from "../dist/index.js";

const SEATS = ["NORTH", "EAST", "SOUTH", "WEST"];

function cardFromId(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function observation(deal, state, legal) {
  const hand = deal.hands[state.actingSeat].map(cardFromId);
  return {
    phase: "BIDDING",
    ownHand: hand,
    exposedCard: deal.exposedCardId ? cardFromId(deal.exposedCardId) : null,
    legalActions: legal,
    bidding: state,
  };
}

function chooseAction(deal, state, index, difficulty = "NORMAL") {
  const exposedSuit = deal.exposedCardId
    ? cardFromId(deal.exposedCardId).suit
    : null;
  const legal = legalBiddingActions(
    state,
    deal.dealerSeat,
    exposedSuit,
    deal.hands,
  );
  const ranking = rankBiddingContracts(observation(deal, state, legal), { difficulty });

  if (ranking.selected && !ranking.shouldPass) {
    const selected = ranking.selected;
    const action = {
      type: selected.action,
      actionId: `a6:${index}:${state.turnNumber}:${selected.action}`,
      ...(selected.action === "BUY_HOKUM" && selected.suit
        ? { suit: selected.suit }
        : {}),
    };
    return { action, legal, ranking };
  }

  return {
    action: {
      type: "PASS",
      actionId: `a6:${index}:${state.turnNumber}:PASS`,
    },
    legal,
    ranking,
  };
}

function run(seed, difficulty = "NORMAL") {
  const deal = createInitialDeal(
    seed,
    "NORTH",
    createSeededRandom(seed),
  );

  let state = createBiddingState(deal.roundId, deal.dealerSeat);
  const actions = [];
  const contracts = [];

  for (let turn = 0; turn < 16 && (state.phase === "FIRST_ROUND" || state.phase === "SECOND_ROUND"); turn += 1) {
    const chosen = chooseAction(deal, state, 0, difficulty);
    assert.ok(chosen.legal.includes(chosen.action.type), `illegal AI action: ${chosen.action.type}`);
    state = applyBiddingAction(
      state,
      chosen.action,
      deal.dealerSeat,
      deal.exposedCardId,
    );
    actions.push(chosen.action.type);
    if (state.selectedContract) {
      contracts.push({
        contract: state.selectedContract.contract,
        trumpSuit: state.selectedContract.trumpSuit,
        purchaserSeat: state.selectedContract.purchaserSeat,
      });
    }
  }

  assert.ok(
    state.phase === "CONTRACT_SELECTED" ||
      state.phase === "CANCELLED",
    `bidding did not terminate: ${state.phase}`,
  );

  return {
    state,
    actions,
    contracts,
  };
}

test("Phase 20-A6: bidding intelligence produces only authoritative legal actions", () => {
  const counts = {
    SUN: 0,
    HOKUM: 0,
    PASS_ONLY: 0,
    CANCELLED: 0,
  };

  for (let i = 0; i < 250; i += 1) {
    const result = run(`phase20a-validation:${i}`, "NORMAL");
    if (result.state.phase === "CANCELLED") {
      counts.CANCELLED += 1;
    } else {
      const contract = result.state.selectedContract?.contract;
      assert.ok(contract === "SUN" || contract === "HOKUM");
      counts[contract] += 1;
    }
  }

  assert.equal(
    counts.SUN + counts.HOKUM + counts.CANCELLED,
    250,
  );
});

test("Phase 20-A6: EASY/NORMAL/HARD remain deterministic on identical observations", () => {
  for (const difficulty of ["EASY", "NORMAL", "HARD"]) {
    const first = run("phase20a-deterministic", difficulty);
    const second = run("phase20a-deterministic", difficulty);

    assert.deepEqual(first.actions, second.actions);
    assert.deepEqual(first.contracts, second.contracts);
    assert.equal(first.state.phase, second.state.phase);
  }
});

test("Phase 20-A6: AI bidding remains player-scoped and never needs hidden hands", () => {
  const deal = createInitialDeal(
    "phase20a-information-boundary",
    "NORTH",
    createSeededRandom("phase20a-information-boundary"),
  );
  const state = createBiddingState(deal.roundId, deal.dealerSeat);
  const exposedSuit = deal.exposedCardId
    ? cardFromId(deal.exposedCardId).suit
    : null;
  const legal = legalBiddingActions(
    state,
    deal.dealerSeat,
    exposedSuit,
    deal.hands,
  );
  const obs = observation(deal, state, legal);

  assert.equal(Object.prototype.hasOwnProperty.call(obs, "opponentHands"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(obs, "deck"), false);
  assert.deepEqual(obs.ownHand.map((c) => c.id), deal.hands[state.actingSeat]);
});

test("Phase 20-A6: all-pass lifecycle remains authoritative", () => {
  const deal = createInitialDeal(
    "phase20a-all-pass",
    "NORTH",
    createSeededRandom("phase20a-all-pass"),
  );
  let state = createBiddingState(deal.roundId, deal.dealerSeat);
  let actionNumber = 0;

  while (state.phase === "FIRST_ROUND" || state.phase === "SECOND_ROUND") {
    const action = {
      type: "PASS",
      actionId: `all-pass:${actionNumber++}`,
    };
    const exposedSuit = deal.exposedCardId
      ? cardFromId(deal.exposedCardId).suit
      : null;
    assert.ok(
      legalBiddingActions(state, deal.dealerSeat, exposedSuit, deal.hands).includes("PASS"),
    );
    state = applyBiddingAction(
      state,
      action,
      deal.dealerSeat,
      deal.exposedCardId,
    );
  }

  assert.equal(state.phase, "CANCELLED");
  assert.equal(state.cancellationReason, "ALL_PASS");
});
