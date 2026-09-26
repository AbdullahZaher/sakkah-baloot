import test from "node:test";
import assert from "node:assert/strict";
import { createLocalHumanVsAISession } from "../dist/index.js";

test("biddingPresentation: initial snapshot exposes correct bidding context and options", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20b-test-seed-1",
    humanSeat: "SOUTH",
  });

  const snapshot = session.getSnapshot();
  assert.equal(snapshot.matchPhase, "ROUND_ACTIVE");
  assert.ok(snapshot.biddingPresentation, "biddingPresentation should be present during bidding");
  assert.equal(snapshot.biddingPresentation.roundNumber, 1);
  assert.equal(snapshot.biddingPresentation.phase, "FIRST_ROUND");
  assert.ok(snapshot.biddingPresentation.exposedCard !== null);
  assert.ok(Array.isArray(snapshot.biddingPresentation.legalOptions));
  assert.ok(Array.isArray(snapshot.biddingPresentation.history));
});

test("biddingPresentation: dispatching legal bid updates state and runs AI turns", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20b-test-seed-sun",
    humanSeat: "SOUTH",
  });

  const snapshot = session.getSnapshot();
  if (snapshot.humanTurn && snapshot.biddingPresentation?.legalOptions.some(o => o.type === "BUY_SUN")) {
    const next = session.dispatchBiddingAction("BUY_SUN");
    assert.equal(next.biddingPresentation?.selectedContract?.contract, "SUN");
  }
});

test("biddingPresentation: dispatching illegal bid throws error", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20b-test-seed-illegal",
    humanSeat: "SOUTH",
  });

  const snapshot = session.getSnapshot();
  if (snapshot.humanTurn) {
    // In round 1, BUY_HOKUM with explicit other suits is not legal
    const nonExposedSuit = snapshot.exposedCard?.suit === "SPADES" ? "HEARTS" : "SPADES";
    assert.throws(() => {
      session.dispatchBiddingAction("BUY_HOKUM", nonExposedSuit);
    }, /Illegal bidding action/);
  }
});

test("biddingPresentation: pass in round 1 advances turn or round properly", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20b-test-seed-pass",
    humanSeat: "SOUTH",
  });

  let snap = session.getSnapshot();
  if (snap.humanTurn) {
    snap = session.dispatchBiddingAction("PASS");
    assert.ok(snap.biddingPresentation !== null || snap.game !== null);
  }
});

test("biddingPresentation: aiThinking is false during human turn and actionFeedback is populated", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20b-test-seed-sun",
    humanSeat: "SOUTH",
  });

  const snapshot = session.getSnapshot();
  if (snapshot.humanTurn && snapshot.biddingPresentation) {
    assert.equal(snapshot.biddingPresentation.aiThinking, false);
    const next = session.dispatchBiddingAction("BUY_SUN");
    assert.ok(next.biddingPresentation !== null);
    assert.ok(next.biddingPresentation.actionFeedback !== null);
    assert.equal(next.biddingPresentation.selectedContract?.contract, "SUN");
  }
});

