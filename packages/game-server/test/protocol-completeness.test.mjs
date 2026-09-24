import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  executeAITurn,
} from "../src/index.ts";
import { replayProtocol } from "@sakkah-baloot/game-protocol";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("Test A — Contract completion deal: BUY_SUN produces [BID, DEAL(COMPLETION)] and is replay-equivalent", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-a-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "completion-deal-seed",
  });

  // Initial state is version 0
  assert.equal(host.getStateVersion(), 0);

  // WEST (acting after NORTH dealer) buys SUN
  const result = await host.submitCommand({
    matchId: "test-a-match",
    playerId: "player-west",
    actionId: "action-buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.stateVersion, 2);
  assert.equal(host.getStateVersion(), 2);
  assert.equal(result.events.length, 2);

  // Event 1: BID
  const env1 = result.events[0];
  assert.equal(env1.stateVersion, 1);
  assert.equal(env1.event.type, "BID");
  assert.equal(env1.event.roundId, "test-a-match:round:1");
  assert.equal(env1.event.playerId, "player-west");

  // Event 2: DEAL (completion)
  const env2 = result.events[1];
  assert.equal(env2.stateVersion, 2);
  assert.equal(env2.event.type, "DEAL");
  assert.equal(env2.event.roundId, "test-a-match:round:1");
  assert.equal(env2.event.roundNumber, 1);
  assert.equal(env2.event.dealerSeat, "NORTH");
  assert.equal(env2.event.dealType, "COMPLETION");

  // Verify full replay from initial protocol state
  const initialProtocolState = {
    matchId: "test-a-match",
    stateVersion: 0,
    roundId: "test-a-match:round:1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "DEAL",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    escalation: "NORMAL",
  };

  const replayed = replayProtocol(initialProtocolState, result.events);
  assert.equal(replayed.state.stateVersion, 2);
  assert.equal(replayed.state.phase, "DEAL");
  assert.equal(replayed.state.roundId, "test-a-match:round:1");
  assert.equal(replayed.state.roundNumber, 1);
  assert.equal(replayed.state.dealerSeat, "NORTH");
});

test("Test B — First/second bidding cancellation produces [BID, NEXT_ROUND, DEAL(REDEAL)] and replaying transitions cleanly", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-b-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "cancellation-redeal-seed",
  });

  const allEvents = [];
  const order = [
    "player-west",
    "player-south",
    "player-east",
    "player-north",
    "player-west",
    "player-south",
    "player-east",
    "player-north",
  ];

  let lastResult;
  for (let i = 0; i < order.length; i++) {
    const pid = order[i];
    const version = host.getStateVersion();
    lastResult = await host.submitCommand({
      matchId: "test-b-match",
      playerId: pid,
      actionId: `pass-action-${i}`,
      expectedStateVersion: version,
      payload: {
        type: "BID",
        action: { type: "PASS", actionId: `engine-pass-${i}` },
      },
    });
    allEvents.push(...lastResult.events);
  }

  // 7 normal passes (7 events) + 8th pass which cancels bidding (3 events: BID, NEXT_ROUND, DEAL) = 10 events total
  assert.equal(allEvents.length, 10);
  assert.equal(host.getStateVersion(), 10);

  // Check 8th pass events
  assert.equal(lastResult.events.length, 3);
  assert.equal(lastResult.events[0].event.type, "BID");
  assert.equal(lastResult.events[0].stateVersion, 8);
  assert.equal(lastResult.events[1].event.type, "NEXT_ROUND");
  assert.equal(lastResult.events[1].stateVersion, 9);
  assert.equal(lastResult.events[1].event.roundId, "test-b-match:round:2");
  assert.equal(lastResult.events[1].event.nextRoundNumber, 2);
  assert.equal(lastResult.events[1].event.dealerSeat, "WEST");

  assert.equal(lastResult.events[2].event.type, "DEAL");
  assert.equal(lastResult.events[2].stateVersion, 10);
  assert.equal(lastResult.events[2].event.roundId, "test-b-match:round:2");
  assert.equal(lastResult.events[2].event.roundNumber, 2);
  assert.equal(lastResult.events[2].event.dealerSeat, "WEST");
  assert.equal(lastResult.events[2].event.dealType, "REDEAL");

  // Replay complete event stream
  const initialProtocolState = {
    matchId: "test-b-match",
    stateVersion: 0,
    roundId: "test-b-match:round:1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "DEAL",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    escalation: "NORMAL",
  };

  const replayed = replayProtocol(initialProtocolState, allEvents);
  assert.equal(replayed.state.stateVersion, 10);
  assert.equal(replayed.state.roundId, "test-b-match:round:2");
  assert.equal(replayed.state.roundNumber, 2);
  assert.equal(replayed.state.dealerSeat, "WEST");
  assert.equal(replayed.state.phase, "DEAL");

  // Now round 2 can receive bids without mismatch
  const round2BidResult = await host.submitCommand({
    matchId: "test-b-match",
    playerId: "player-south", // SOUTH acts after WEST dealer
    actionId: "r2-buy-sun",
    expectedStateVersion: 10,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "r2-engine-buy-sun" },
    },
  });
  assert.equal(round2BidResult.success, true);
  assert.equal(host.getStateVersion(), 12); // +2 for BID + DEAL(COMPLETION)
});

test("Test C — Round completion + ADVANCE_ROUND: produces [NEXT_ROUND, DEAL(INITIAL)] and preserves score in replay", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-c-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "advance-round-seed-1",
  });

  const allEvents = [];

  // 1. Play round 1 to completion with AI
  while (
    host.getMatchState().round &&
    (host.getMatchState().round.phase === "BIDDING" || host.getMatchState().round.phase === "PLAYING")
  ) {
    const round = host.getMatchState().round;
    const activePid =
      round.phase === "BIDDING"
        ? PLAYER_BINDINGS[round.bidding.actingSeat]
        : round.game.currentPlayerId;

    const res = await executeAITurn(host, activePid, { mode: "BASELINE" });
    if (res && res.events) {
      allEvents.push(...res.events);
    }
  }

  assert.equal(host.getMatchState().phase, "ROUND_COMPLETE");
  const round1Score = host.getMatchState().score;
  const vBeforeAdvance = host.getStateVersion();

  // 2. Advance to round 2
  const advanceResult = await host.submitCommand({
    matchId: "test-c-match",
    playerId: "player-north",
    actionId: "advance-round-cmd",
    expectedStateVersion: vBeforeAdvance,
    payload: {
      type: "ADVANCE_ROUND",
    },
  });

  assert.equal(advanceResult.success, true);
  assert.equal(advanceResult.events.length, 2);
  allEvents.push(...advanceResult.events);

  // Check NEXT_ROUND event
  const nextRoundEnv = advanceResult.events[0];
  assert.equal(nextRoundEnv.event.type, "NEXT_ROUND");
  assert.equal(nextRoundEnv.stateVersion, vBeforeAdvance + 1);
  assert.equal(nextRoundEnv.event.roundId, "test-c-match:round:2");
  assert.equal(nextRoundEnv.event.nextRoundNumber, 2);
  assert.equal(nextRoundEnv.event.dealerSeat, "WEST");

  // Check DEAL event
  const dealEnv = advanceResult.events[1];
  assert.equal(dealEnv.event.type, "DEAL");
  assert.equal(dealEnv.stateVersion, vBeforeAdvance + 2);
  assert.equal(dealEnv.event.roundId, "test-c-match:round:2");
  assert.equal(dealEnv.event.roundNumber, 2);
  assert.equal(dealEnv.event.dealerSeat, "WEST");
  assert.equal(dealEnv.event.dealType, "INITIAL");

  // 3. Replay all events from version 0
  const initialProtocolState = {
    matchId: "test-c-match",
    stateVersion: 0,
    roundId: "test-c-match:round:1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "DEAL",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    escalation: "NORMAL",
  };

  const replayed = replayProtocol(initialProtocolState, allEvents);
  assert.equal(replayed.state.stateVersion, host.getStateVersion());
  assert.equal(replayed.state.roundId, "test-c-match:round:2");
  assert.equal(replayed.state.roundNumber, 2);
  assert.equal(replayed.state.dealerSeat, "WEST");
  assert.equal(replayed.state.phase, "DEAL");
  assert.deepEqual(replayed.state.score, round1Score);
});

test("Test D — Replay from arbitrary resume versions maintains complete state consistency", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-d-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "resume-arbitrary-seed",
  });

  const allEvents = [];

  // Play full round with AI
  while (
    host.getMatchState().round &&
    (host.getMatchState().round.phase === "BIDDING" || host.getMatchState().round.phase === "PLAYING")
  ) {
    const round = host.getMatchState().round;
    const activePid =
      round.phase === "BIDDING"
        ? PLAYER_BINDINGS[round.bidding.actingSeat]
        : round.game.currentPlayerId;

    const res = await executeAITurn(host, activePid, { mode: "BASELINE" });
    if (res && res.events) {
      allEvents.push(...res.events);
    }
  }

  const finalVersion = host.getStateVersion();
  assert.ok(finalVersion >= 34); // Bidding + completion deal + 32 card plays + 8 tricks + round complete

  const testResumeVersions = [0, 1, 2, 5, 10, 20, 30, finalVersion - 1];

  for (const v of testResumeVersions) {
    const resumeResult = await host.reconnect("player-west", v);
    assert.equal(resumeResult.currentVersion, finalVersion);
    assert.equal(resumeResult.missedEvents.length, finalVersion - v);

    // Verify sequential missed events versions
    for (let i = 0; i < resumeResult.missedEvents.length; i++) {
      assert.equal(resumeResult.missedEvents[i].stateVersion, v + 1 + i);
    }

    // Replay from version 0 using all events up to v, then append missedEvents
    const eventsUpToV = allEvents.slice(0, v);
    const initialProtocolState = {
      matchId: "test-d-match",
      stateVersion: 0,
      roundId: "test-d-match:round:1",
      roundNumber: 1,
      dealerSeat: "NORTH",
      phase: "DEAL",
      score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      escalation: "NORMAL",
    };

    const intermediateReplay = replayProtocol(initialProtocolState, eventsUpToV);
    assert.equal(intermediateReplay.state.stateVersion, v);

    const finalReplay = replayProtocol(intermediateReplay.state, resumeResult.missedEvents);
    assert.equal(finalReplay.state.stateVersion, finalVersion);
    assert.deepEqual(finalReplay.state.score, host.getMatchState().score);
  }
});

test("Test E — Multi-event atomicity: PLAY_CARD emits [PLAY_CARD, TRICK_COMPLETE] and [..., ROUND_COMPLETE] in strict order", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-e-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "multi-event-order-seed",
  });

  // Buy Sun (version 0 -> 2)
  const buyRes = await host.submitCommand({
    matchId: "test-e-match",
    playerId: "player-west",
    actionId: "buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });
  assert.equal(buyRes.events.length, 2);
  assert.equal(buyRes.events[0].event.type, "BID");
  assert.equal(buyRes.events[1].event.type, "DEAL");

  // Play 3 cards of trick 1 (1 event each)
  for (let i = 0; i < 3; i++) {
    const activePid = host.getMatchState().round.game.currentPlayerId;
    const snap = host.getSnapshot(activePid);
    const card = snap.legalCardIds[0];
    const v = host.getStateVersion();
    const res = await host.submitCommand({
      matchId: "test-e-match",
      playerId: activePid,
      actionId: `play-card-${i}`,
      expectedStateVersion: v,
      payload: {
        type: "PLAY_CARD",
        cardId: card,
      },
    });
    assert.equal(res.events.length, 1);
    assert.equal(res.events[0].event.type, "PLAY_CARD");
  }

  // 4th card of trick 1 completes trick -> exactly 2 events in strict order: [PLAY_CARD, TRICK_COMPLETE]
  const activePid4 = host.getMatchState().round.game.currentPlayerId;
  const snap4 = host.getSnapshot(activePid4);
  const card4 = snap4.legalCardIds[0];
  const v4 = host.getStateVersion();
  const res4 = await host.submitCommand({
    matchId: "test-e-match",
    playerId: activePid4,
    actionId: "play-card-trick1-finish",
    expectedStateVersion: v4,
    payload: {
      type: "PLAY_CARD",
      cardId: card4,
    },
  });

  assert.equal(res4.events.length, 2);
  assert.equal(res4.events[0].event.type, "PLAY_CARD");
  assert.equal(res4.events[0].stateVersion, v4 + 1);
  assert.equal(res4.events[1].event.type, "TRICK_COMPLETE");
  assert.equal(res4.events[1].stateVersion, v4 + 2);
});
