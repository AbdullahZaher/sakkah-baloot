import test from "node:test";
import assert from "node:assert/strict";

import {
  applyProtocolEvent,
  deterministicEventId,
  replayProtocol,
} from "../src/index.ts";

const initial = {
  matchId: "match-protocol-17",
  stateVersion: 0,
  roundId: "match-protocol-17:round:1",
  roundNumber: 1,
  dealerSeat: "NORTH",
  phase: "DEAL",
  score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
  escalation: "NORMAL",
};

const dealEvent = {
  type: "DEAL",
  roundId: initial.roundId,
  roundNumber: 1,
  dealerSeat: "NORTH",
};

test("deterministic event IDs are stable and state-version scoped", () => {
  const first = deterministicEventId(initial.matchId, 1, dealEvent);
  const second = deterministicEventId(initial.matchId, 1, dealEvent);
  const later = deterministicEventId(initial.matchId, 2, dealEvent);

  assert.equal(first, second);
  assert.notEqual(first, later);
  assert.equal(first, "match-protocol-17:v1:DEAL:match-protocol-17:round:1");
});

test("protocol replay is deterministic and duplicate event IDs are idempotent", () => {
  const events = [
    {
      matchId: initial.matchId,
      eventId: deterministicEventId(initial.matchId, 1, dealEvent),
      stateVersion: 1,
      event: dealEvent,
    },
    {
      matchId: initial.matchId,
      eventId: deterministicEventId(initial.matchId, 2, {
        type: "BID",
        roundId: initial.roundId,
        playerId: "WEST_PLAYER",
        action: { type: "PASS", actionId: "bid-2" },
      }),
      stateVersion: 2,
      event: {
        type: "BID",
        roundId: initial.roundId,
        playerId: "WEST_PLAYER",
        action: { type: "PASS", actionId: "bid-2" },
      },
    },
    {
      matchId: initial.matchId,
      eventId: deterministicEventId(initial.matchId, 3, {
        type: "ROUND_COMPLETE",
        roundId: initial.roundId,
        score: { NORTH_SOUTH: 26, EAST_WEST: 0 },
        matchEnd: { status: "ONGOING", score: { NORTH_SOUTH: 26, EAST_WEST: 0 } },
      }),
      stateVersion: 3,
      event: {
        type: "ROUND_COMPLETE",
        roundId: initial.roundId,
        score: { NORTH_SOUTH: 26, EAST_WEST: 0 },
        matchEnd: { status: "ONGOING", score: { NORTH_SOUTH: 26, EAST_WEST: 0 } },
      },
    },
  ];

  const once = replayProtocol(initial, events);
  const twice = replayProtocol(initial, [...events, events[2]]);

  assert.deepEqual(twice.state, once.state);
  assert.deepEqual(twice.appliedEventIds, once.appliedEventIds);
  assert.equal(once.state.stateVersion, 3);
  assert.deepEqual(once.state.score, { NORTH_SOUTH: 26, EAST_WEST: 0 });
});

test("protocol replay rejects skipped state versions and cross-match events", () => {
  assert.throws(
    () => applyProtocolEvent(
      initial,
      {
        matchId: initial.matchId,
        eventId: "bad-version",
        stateVersion: 2,
        event: dealEvent,
      },
    ),
    /not sequential/,
  );

  assert.throws(
    () => applyProtocolEvent(
      initial,
      {
        matchId: "other-match",
        eventId: "other-match-event",
        stateVersion: 1,
        event: dealEvent,
      },
    ),
    /another match/,
  );
});
