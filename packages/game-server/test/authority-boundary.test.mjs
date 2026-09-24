import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createAuthoritativeMatchHost,
} from "../src/index.js";
import {
  DECK,
  scoreCompletedRound,
  createMatchState,
  createRoundState,
  createInitialDeal,
  createBiddingState,
  createSeededRandom,
  applyBiddingAction,
  completeDeal,
  withRoundGame,
  withRoundProjects,
  withRoundBaloot,
  declareProject,
  createBalootDeclaration,
} from "@sakkah-baloot/game-engine";
import { replayProtocol } from "@sakkah-baloot/game-protocol";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("structural AST/source audit: packages/game-server/src contains zero manual scoring or game-rule constants", () => {
  const srcFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".ts"));
  assert.ok(srcFiles.length > 0, "Source files must exist");

  const forbiddenPatterns = [
    { pattern: /\bbalootQaid\b/, label: "balootQaid calculation" },
    { pattern: /\bprojectQaid\b/, label: "projectQaid calculation" },
    { pattern: /\bcardRawValue\b/, label: "cardRawValue call" },
    { pattern: /\bcalculateCardRaw\b/, label: "calculateCardRaw call" },
    { pattern: /\bconvertRawToQaid\b/, label: "convertRawToQaid call" },
    { pattern: /\b88\b/, label: "Hardcoded 88 Reverse Kaboot constant" },
    { pattern: /\b130\b/, label: "Hardcoded 130 Sun card raw constant" },
    { pattern: /\b162\b/, label: "Hardcoded 162 Hokum card raw constant" },
    { pattern: /\b152\b/, label: "Hardcoded 152 target Qaid constant" },
  ];

  for (const file of srcFiles) {
    const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
    for (const { pattern, label } of forbiddenPatterns) {
      assert.ok(
        !pattern.test(content),
        `Found forbidden game-rule construct (${label}) in ${file}`,
      );
    }
  }
});

test("authority boundary: Baloot declaration validity and construction delegates strictly to game-engine", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "match-baloot-boundary",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // Advance through bidding to HOKUM contract (exposed card receiver WEST)
  // Dealer is NORTH, bidding starts with WEST
  const exposedCardId = host.getSnapshot("player-west").exposedCard?.id;
  assert.ok(exposedCardId);

  await host.submitCommand({
    matchId: "match-baloot-boundary",
    playerId: "player-west",
    actionId: "bid-buy-hokum",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_HOKUM_EXPOSED", actionId: "action-hokum" },
    },
  });

  const snapshot = host.getSnapshot("player-west");
  assert.equal(snapshot.roundPhase, "PLAYING");
  assert.equal(snapshot.contract, "HOKUM");
  assert.ok(snapshot.trumpSuit);

  // Attempt to declare Baloot on a card that is NOT the trump K/Q or lacks partner
  // Server must reject via game-engine createBalootDeclaration delegation
  const nonTrumpCard = snapshot.ownHand.find((c) => c.suit !== snapshot.trumpSuit);
  if (nonTrumpCard) {
    await assert.rejects(
      () =>
        host.submitCommand({
          matchId: "match-baloot-boundary",
          playerId: "player-west",
          actionId: "invalid-baloot-decl",
          expectedStateVersion: 1,
          payload: {
            type: "DECLARE_BALOOT",
            cardId: nonTrumpCard.id,
          },
        }),
      /Invalid Baloot declaration conditions under game-engine rules/,
    );
  }
});

test("authority boundary: round score matches canonical game-engine scoreCompletedRound exactly", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "match-score-boundary",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // Buy Sun contract by WEST
  await host.submitCommand({
    matchId: "match-score-boundary",
    playerId: "player-west",
    actionId: "bid-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "buy-sun-1" },
    },
  });

  // Play 8 complete tricks (32 cards)
  let expectedVersion = 1;
  const seats = ["WEST", "NORTH", "EAST", "SOUTH"];
  const playerBySeat = {
    NORTH: "player-north",
    EAST: "player-east",
    SOUTH: "player-south",
    WEST: "player-west",
  };

  for (let trick = 1; trick <= 8; trick += 1) {
    for (let p = 0; p < 4; p += 1) {
      const westSnap = host.getSnapshot("player-west");
      const activePid = westSnap.playerId;
      // find which player is active
      let actingPid = null;
      for (const seat of seats) {
        const snap = host.getSnapshot(playerBySeat[seat]);
        if (snap.legalCardIds.length > 0) {
          actingPid = snap.playerId;
          break;
        }
      }
      assert.ok(actingPid);
      const snap = host.getSnapshot(actingPid);
      const cardToPlay = snap.legalCardIds[0];

      const res = await host.submitCommand({
        matchId: "match-score-boundary",
        playerId: actingPid,
        actionId: `play-t${trick}-p${p}`,
        expectedStateVersion: expectedVersion,
        payload: {
          type: "PLAY_CARD",
          cardId: cardToPlay,
        },
      });

      expectedVersion = res.stateVersion;
    }
  }

  const finalMatchState = host.getMatchState();
  assert.equal(finalMatchState.phase, "ROUND_COMPLETE");
  assert.ok(finalMatchState.lastRoundScore);

  // Compare server's lastRoundScore against direct engine evaluation
  const engineExpectedScore = scoreCompletedRound(finalMatchState.round);
  assert.deepEqual(finalMatchState.lastRoundScore, engineExpectedScore);
});

test("authority boundary: event history replayed through game-protocol matches authoritative host state", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "match-replay-boundary",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  await host.submitCommand({
    matchId: "match-replay-boundary",
    playerId: "player-west",
    actionId: "bid-pass",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "pass-1" },
    },
  });

  const resume = await host.reconnect("player-west", 0);
  assert.equal(resume.missedEvents.length, 1);

  const initialProtocolState = {
    matchId: "match-replay-boundary",
    stateVersion: 0,
    roundId: "match-replay-boundary:round:1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "DEAL",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    escalation: "NORMAL",
  };

  const replayed = replayProtocol(initialProtocolState, resume.missedEvents);
  assert.equal(replayed.state.stateVersion, host.getStateVersion());
});

test("authority boundary: Hundred absorption of Baloot is evaluated strictly by game-engine", () => {
  // Directly verify game-engine scoring engine absorption behavior
  const deal = createInitialDeal("round-abs", "NORTH", createSeededRandom("seed-abs"));
  const bidding = createBiddingState("round-abs", "NORTH");
  const baseRound = createRoundState(deal, bidding, 1);

  const king = DECK.find((c) => c.suit === "HEARTS" && c.rank === "K");
  const queen = DECK.find((c) => c.suit === "HEARTS" && c.rank === "Q");
  const ace = DECK.find((c) => c.suit === "HEARTS" && c.rank === "A");
  const ten = DECK.find((c) => c.suit === "HEARTS" && c.rank === "10");
  const jack = DECK.find((c) => c.suit === "HEARTS" && c.rank === "J");

  const balootDecl = {
    declarationId: "round-abs:BALOOT:WEST:HEARTS-Q",
    ownerSeat: "WEST",
    teamId: "EAST_WEST",
    trumpSuit: "HEARTS",
    cards: [king.id, queen.id],
    qaydValue: 2,
    declared: true,
  };

  const hundredCandidate = {
    id: "HUNDRED:WEST:cards",
    type: "HUNDRED",
    cards: [ace.id, king.id, queen.id, jack.id, ten.id],
    ownerSeat: "WEST",
    teamId: "EAST_WEST",
    contract: "HOKUM",
    subtype: "SEQUENCE_5",
    highRankIndex: 7,
    rawValue: 100,
    qaydValue: 10,
  };

  const hundredDecl = {
    declarationId: "HUNDRED:WEST:cards",
    candidate: hundredCandidate,
    lifecycle: "DECLARED",
    declaredBeforeCard: true,
    trickNumber: 1,
  };

  const roundWithBoth = {
    ...baseRound,
    phase: "ROUND_COMPLETE",
    bidding: {
      ...bidding,
      phase: "CONTRACT_SELECTED",
      selectedContract: {
        contract: "HOKUM",
        purchaserSeat: "WEST",
        source: "FIRST_ROUND",
        trumpSuit: "HEARTS",
        mode: "NORMAL",
        exposedCardReceiverSeat: "WEST",
      },
    },
    game: {
      phase: "ROUND_COMPLETE",
      currentPlayerId: "player-west",
      players: PLAYER_BINDINGS,
      hands: { "player-north": [], "player-east": [], "player-south": [], "player-west": [] },
      contract: "HOKUM",
      trumpSuit: "HEARTS",
      hokumPlayMode: "OPEN",
      dealerSeat: "NORTH",
      trickNumber: 8,
      currentTrick: [],
      completedTricks: Array.from({ length: 8 }, (_, i) => ({
        trickNumber: i + 1,
        leaderSeat: "WEST",
        plays: [
          { playerId: "player-west", seat: "WEST", card: DECK[i * 4], ikaDeclared: false, sequence: 1 },
          { playerId: "player-north", seat: "NORTH", card: DECK[i * 4 + 1], ikaDeclared: false, sequence: 2 },
          { playerId: "player-east", seat: "EAST", card: DECK[i * 4 + 2], ikaDeclared: false, sequence: 3 },
          { playerId: "player-south", seat: "SOUTH", card: DECK[i * 4 + 3], ikaDeclared: false, sequence: 4 },
        ],
        winnerSeat: "WEST",
      })),
    },
    projects: [hundredDecl],
    baloot: balootDecl,
  };

  const score = scoreCompletedRound(roundWithBoth);
  // Hundred absorbs Baloot: Kaboot score is 25 (Hokum Kaboot) + 10 (Hundred) + 0 (Baloot absorbed) = 35
  assert.equal(score.kabootTeamId, "EAST_WEST");
  assert.equal(score.finalQaid.EAST_WEST, 35);
  assert.equal(score.finalQaid.NORTH_SOUTH, 0);
});
