import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  executeAITurn,
} from "../src/index.ts";
import {
  applyProtocolEvent,
  replayProtocol,
} from "@sakkah-baloot/game-protocol";

const PLAYER_BINDINGS = {
  NORTH: "p-north",
  EAST: "p-east",
  SOUTH: "p-south",
  WEST: "p-west",
};

test("replay equivalence: replaying event store events matches authoritative state", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "replay-equiv-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "replay-seed-42",
  });

  const allEmittedEnvelopes = [];

  // 1. Run Bidding
  while (host.getMatchState().round.phase === "BIDDING") {
    const actingSeat = host.getMatchState().round.bidding.actingSeat;
    const pid = PLAYER_BINDINGS[actingSeat];
    const res = await executeAITurn(host, pid, { mode: "BASELINE" });
    if (res && res.events) {
      allEmittedEnvelopes.push(...res.events);
    }
  }

  // 2. Play 2 complete tricks (8 cards)
  let plays = 0;
  while (
    host.getMatchState().round.phase === "PLAYING" &&
    plays < 8
  ) {
    const activePid = host.getMatchState().round.game.currentPlayerId;
    const res = await executeAITurn(host, activePid, { mode: "BASELINE" });
    if (res && res.events) {
      allEmittedEnvelopes.push(...res.events);
    }
    plays++;
  }

  assert.equal(host.getStateVersion(), allEmittedEnvelopes.length);

  // 3. Replay protocol events
  const initialProtocolState = {
    matchId: "replay-equiv-match",
    stateVersion: 0,
    roundId: "replay-equiv-match:round:1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "DEAL",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    escalation: "NORMAL",
  };

  // Convert DEAL initial phase
  const initialWithDeal = {
    ...initialProtocolState,
    phase: "BID",
  };

  const replayResult = replayProtocol(initialWithDeal, allEmittedEnvelopes);

  assert.equal(replayResult.state.stateVersion, host.getStateVersion());
  assert.equal(replayResult.appliedEventIds.length, allEmittedEnvelopes.length);
});
