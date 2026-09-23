import test from "node:test";
import assert from "node:assert/strict";
import {
  DECK,
  cardRawValue,
  convertRawToQaid,
  createSeededRandom,
  createInitialDeal,
  completeDeal,
  detectProjects,
  getLegalMoves,
  applyCardPlay,
  resolveTrick,
  evaluateMatchEnd,
  projectMultiplier,
  scoreRound,
  teamOfSeat,
  nextCounterClockwise,
  createEscalationState,
  canEscalate,
  escalate,
  closeEscalation,
  declareProject,
  resolveProjects,
  replay,
  createBiddingState,
  legalBiddingActions,
  applyBiddingAction,
  applyBiddingTimeout,
  BIDDING_TIMEOUT_MS,
  qualifiesForKasho,
  canDeclareKasho,
  declareKasho,
  resolveKasho,
  createIntegrityIncident,
  resolveIntegrityIncident,
} from "../dist/index.js";

const card = (id) => DECK.find((c) => c.id === id);
const hand = (...ids) => ids.map((id) => card(id));

test("deck has exactly 32 unique cards", () => {
  assert.equal(DECK.length, 32);
  assert.equal(new Set(DECK.map((c) => c.id)).size, 32);
});

test("canonical raw card values", () => {
  assert.equal(cardRawValue(card("CLUBS-A"), "SUN", null), 11);
  assert.equal(cardRawValue(card("CLUBS-J"), "SUN", null), 2);
  assert.equal(cardRawValue(card("CLUBS-J"), "HOKUM", "CLUBS"), 20);
  assert.equal(cardRawValue(card("CLUBS-9"), "HOKUM", "CLUBS"), 14);
});

test("canonical Qaid conversion golden cases", () => {
  assert.deepEqual(
    [34, 35, 36, 81, 85, 86, 162].map((n) => convertRawToQaid("HOKUM", n)),
    [3, 3, 4, 8, 8, 9, 16],
  );
  assert.deepEqual(
    [34, 35, 36, 64, 65, 66, 130].map((n) => convertRawToQaid("SUN", n)),
    [6, 7, 8, 12, 13, 14, 26],
  );
});

test("seeded dealing is deterministic and conserves the deck", () => {
  const a = createInitialDeal("r1", "NORTH", createSeededRandom("match-seed"));
  const b = createInitialDeal("r1", "NORTH", createSeededRandom("match-seed"));
  assert.deepEqual(a, b);
  assert.equal(a.exposedCardId !== null, true);
  assert.equal(a.deck.length, 11);
  for (const seat of ["NORTH","EAST","SOUTH","WEST"]) assert.equal(a.hands[seat].length, 5);
  const done = completeDeal(a, "NORTH");
  for (const seat of ["NORTH","EAST","SOUTH","WEST"]) assert.equal(done.hands[seat].length, 8);
  assert.equal(done.deck.length, 0);
  assert.equal(done.exposedCardId, null);
});

test("project detection recognizes sequence and four aces", () => {
  const sera = detectProjects(hand("CLUBS-7","CLUBS-8","CLUBS-9"), "SUN", null, "NORTH");
  assert.ok(sera.some((p) => p.type === "SERA"));
  const fourAces = detectProjects(
    hand("CLUBS-A","DIAMONDS-A","HEARTS-A","SPADES-A"),
    "SUN", null, "NORTH",
  );
  assert.ok(fourAces.some((p) => p.type === "FOUR_HUNDRED"));
});

test("project multipliers are canonical", () => {
  assert.equal(projectMultiplier("NORMAL"), 1);
  assert.equal(projectMultiplier("DOUBLE"), 2);
  assert.equal(projectMultiplier("TRIPLE"), 1);
  assert.equal(projectMultiplier("FOUR"), 1);
});

function legalState(overrides = {}) {
  const players = { pN: "NORTH", pE: "EAST", pS: "SOUTH", pW: "WEST" };
  const hands = {
    pN: hand("CLUBS-A"),
    pE: hand("DIAMONDS-7"),
    pS: hand("HEARTS-7"),
    pW: hand("SPADES-7"),
  };
  return {
    phase: "PLAYING",
    currentPlayerId: "pN",
    players,
    hands,
    contract: "HOKUM",
    trumpSuit: "HEARTS",
    hokumPlayMode: "OPEN",
    dealerSeat: "NORTH",
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
    ...overrides,
  };
}

test("legal move generation follows led suit", () => {
  const state = legalState({
    currentPlayerId: "pE",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7","DIAMONDS-A","HEARTS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [{
      playerId: "pN", seat: "NORTH", card: card("DIAMONDS-K"), ikaDeclared: false, sequence: 1,
    }],
  });
  assert.deepEqual(getLegalMoves(state, "pE").map((m) => m.cardId), ["DIAMONDS-7","DIAMONDS-A"]);
});

test("Hokum requires trump when opponent wins and player has no led suit", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7","SPADES-A"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-7"]);
});

test("locked Hokum forbids leading trump while a non-trump exists", () => {
  const state = legalState({
    hokumPlayMode: "LOCKED",
    currentPlayerId: "pN",
    hands: {
      pN: hand("HEARTS-7","CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-8"),
      pW: hand("SPADES-7"),
    },
  });
  assert.deepEqual(getLegalMoves(state, "pN").map((m) => m.cardId), ["CLUBS-A"]);
});

test("match equal crossing target produces EXTRA_DEAL", () => {
  assert.deepEqual(evaluateMatchEnd({NORTH_SOUTH: 152,EAST_WEST: 152}), {
    status: "EXTRA_DEAL",
    score: {NORTH_SOUTH: 152,EAST_WEST: 152},
  });
  assert.deepEqual(evaluateMatchEnd({NORTH_SOUTH: 120,EAST_WEST: 120}), {
    status: "ONGOING",
    score: {NORTH_SOUTH: 120,EAST_WEST: 120},
  });
  assert.deepEqual(evaluateMatchEnd({NORTH_SOUTH: 153,EAST_WEST: 160}), {
    status: "FINISHED",
    score: {NORTH_SOUTH: 153,EAST_WEST: 160},
    winnerTeamId: "EAST_WEST",
  });
});

test("seat direction is canonical counter-clockwise", () => {
  assert.equal(nextCounterClockwise("NORTH"), "WEST");
  assert.equal(nextCounterClockwise("WEST"), "SOUTH");
  assert.equal(teamOfSeat("NORTH"), "NORTH_SOUTH");
});


test("Sun scoring conserves 130 raw points and converts to 26 Qaid", () => {
  const tricks = [];
  const seats = ["NORTH","WEST","SOUTH","EAST"];
  const groups = [
    ["CLUBS-A","CLUBS-10","CLUBS-K","CLUBS-Q"],
    ["CLUBS-J","CLUBS-9","CLUBS-8","CLUBS-7"],
    ["DIAMONDS-A","DIAMONDS-10","DIAMONDS-K","DIAMONDS-Q"],
    ["DIAMONDS-J","DIAMONDS-9","DIAMONDS-8","DIAMONDS-7"],
    ["HEARTS-A","HEARTS-10","HEARTS-K","HEARTS-Q"],
    ["HEARTS-J","HEARTS-9","HEARTS-8","HEARTS-7"],
    ["SPADES-A","SPADES-10","SPADES-K","SPADES-Q"],
    ["SPADES-J","SPADES-9","SPADES-8","SPADES-7"],
  ];
  for (let i = 0; i < groups.length; i++) {
    const plays = groups[i].map((id, j) => ({
      playerId: "p" + j,
      seat: seats[j],
      card: card(id),
      ikaDeclared: false,
      sequence: j + 1,
    }));
    tricks.push({ trickNumber: i + 1, leaderSeat: "NORTH", plays, winnerSeat: i < 4 ? "NORTH" : "EAST" });
  }
  const score = scoreRound({
    contract: "SUN",
    trumpSuit: null,
    purchaserSeat: "NORTH",
    dealerSeat: "EAST",
    buyerOriginallyHeldAce: true,
    escalation: "NORMAL",
    tricks,
    projectRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    projectQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
  });
  assert.equal(score.cardRaw.NORTH_SOUTH + score.cardRaw.EAST_WEST, 130);
  assert.equal(score.convertedQaid.NORTH_SOUTH + score.convertedQaid.EAST_WEST, 26);
});

test("overtrump is mandatory when opponent trump is beatable", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("HEARTS-9"),
      pS: hand("HEARTS-J","HEARTS-8"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("HEARTS-9"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-J"]);
});


test("valid Ika partner exemption allows any card for the third player", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-J","SPADES-7"),
      pW: hand("CLUBS-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: true, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-J","SPADES-7"]);
});

test("Ace without valid Ika does not grant partner exemption", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-J","SPADES-7"),
      pW: hand("CLUBS-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-J"]);
});


test("Sun with no lead suit allows any card", () => {
  const state = legalState({
    contract: "SUN",
    trumpSuit: null,
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-J","SPADES-A"),
      pW: hand("CLUBS-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-J","SPADES-A"]);
});

test("opponent winning trump with no higher trump allows any trump", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("HEARTS-J"),
      pS: hand("HEARTS-8","SPADES-A"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("HEARTS-J"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-8"]);
});

test("third player with partner winning may play any trump when partner wins with trump", () => {
  const state = legalState({
    currentPlayerId: "pS",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("HEARTS-J"),
      pS: hand("HEARTS-9","SPADES-A"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("HEARTS-J"), ikaDeclared: false, sequence: 2 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pS").map((m) => m.cardId), ["HEARTS-9"]);
});

test("fourth player with partner winning and no lead suit may play any card", () => {
  const state = legalState({
    currentPlayerId: "pE",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("HEARTS-8","SPADES-A"),
      pS: hand("DIAMONDS-7"),
      pW: hand("CLUBS-K"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-7"), ikaDeclared: false, sequence: 1 },
      { playerId: "pW", seat: "WEST", card: card("CLUBS-K"), ikaDeclared: false, sequence: 2 },
      { playerId: "pS", seat: "SOUTH", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 3 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pE").map((m) => m.cardId), ["HEARTS-8","SPADES-A"]);
});

test("fourth player with partner winning trump must follow trump when trump is led", () => {
  const state = legalState({
    currentPlayerId: "pW",
    hands: {
      pN: hand("HEARTS-J"),
      pE: hand("HEARTS-9"),
      pS: hand("HEARTS-8"),
      pW: hand("HEARTS-7","SPADES-A"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("HEARTS-J"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("HEARTS-9"), ikaDeclared: false, sequence: 2 },
      { playerId: "pS", seat: "SOUTH", card: card("HEARTS-8"), ikaDeclared: false, sequence: 3 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pW").map((m) => m.cardId), ["HEARTS-7"]);
});

test("Ika requires the highest remaining non-trump card of the led suit", () => {
  const valid = legalState({
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-A","CLUBS-K","DIAMONDS-7"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
  });
  assert.deepEqual(getLegalMoves(valid, "pN").map((m) => m.cardId), ["CLUBS-A","CLUBS-K","DIAMONDS-7"]);

  const invalid = legalState({
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-K","CLUBS-A","DIAMONDS-7"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
  });
  assert.throws(
    () => applyCardPlay(invalid, "pN", "CLUBS-K", true),
    /Invalid Ika declaration/,
  );
});

test("Ika declaration has zero state mutation when invalid", () => {
  const state = legalState({
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-K","CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
  });
  const before = structuredClone(state);
  assert.throws(() => applyCardPlay(state, "pN", "CLUBS-K", true), /Invalid Ika declaration/);
  assert.deepEqual(state, before);
});

test("valid Ika is recorded on the committed lead play", () => {
  const state = legalState({
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-A","CLUBS-K"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
  });
  const next = applyCardPlay(state, "pN", "CLUBS-A", true);
  assert.equal(next.currentTrick[0].ikaDeclared, true);
  assert.equal(next.hands.pN.some((c) => c.id === "CLUBS-A"), false);
});

test("locked Hokum allows leading trump when hand contains only trump", () => {
  const state = legalState({
    hokumPlayMode: "LOCKED",
    currentPlayerId: "pN",
    hands: {
      pN: hand("HEARTS-7","HEARTS-8"),
      pE: hand("DIAMONDS-7"),
      pS: hand("CLUBS-7"),
      pW: hand("SPADES-7"),
    },
  });
  assert.deepEqual(getLegalMoves(state, "pN").map((m) => m.cardId), ["HEARTS-7","HEARTS-8"]);
});

test("illegal card play is rejected without mutating state", () => {
  const state = legalState({
    currentPlayerId: "pE",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7","HEARTS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("DIAMONDS-K"), ikaDeclared: false, sequence: 1 },
    ],
  });
  const before = structuredClone(state);
  assert.throws(() => applyCardPlay(state, "pE", "HEARTS-7"), /Illegal card/);
  assert.deepEqual(state, before);
});

test("trick resolution uses canonical counter-clockwise winner handoff", () => {
  const state = legalState({
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("CLUBS-7"),
      pS: hand("DIAMONDS-7"),
      pW: hand("SPADES-7"),
    },
  });
  const s1 = applyCardPlay(state, "pN", "CLUBS-A");
  const s2 = applyCardPlay(s1, "pW", "SPADES-7");
  const s3 = applyCardPlay(s2, "pS", "DIAMONDS-7");
  const s4 = applyCardPlay(s3, "pE", "CLUBS-7");
  assert.equal(s4.completedTricks[0].winnerSeat, "NORTH");
  assert.equal(s4.currentPlayerId, "pN");
});


function canonicalSunTricks(winnerSeat = "NORTH") {
  const tricks = [];
  const seats = ["NORTH","WEST","SOUTH","EAST"];
  const groups = [
    ["CLUBS-A","CLUBS-10","CLUBS-K","CLUBS-Q"],
    ["CLUBS-J","CLUBS-9","CLUBS-8","CLUBS-7"],
    ["DIAMONDS-A","DIAMONDS-10","DIAMONDS-K","DIAMONDS-Q"],
    ["DIAMONDS-J","DIAMONDS-9","DIAMONDS-8","DIAMONDS-7"],
    ["HEARTS-A","HEARTS-10","HEARTS-K","HEARTS-Q"],
    ["HEARTS-J","HEARTS-9","HEARTS-8","HEARTS-7"],
    ["SPADES-A","SPADES-10","SPADES-K","SPADES-Q"],
    ["SPADES-J","SPADES-9","SPADES-8","SPADES-7"],
  ];
  for (let i = 0; i < groups.length; i++) {
    tricks.push({
      trickNumber: i + 1,
      leaderSeat: "NORTH",
      plays: groups[i].map((id, j) => ({
        playerId: "p" + j,
        seat: seats[j],
        card: card(id),
        ikaDeclared: false,
        sequence: j + 1,
      })),
      winnerSeat,
    });
  }
  return tricks;
}

test("Kaboot uses the dedicated flat Hokum value at every ordinary level", () => {
  for (const escalation of ["NORMAL","DOUBLE","TRIPLE","FOUR"]) {
    const score = scoreRound({
      contract: "HOKUM",
      trumpSuit: "CLUBS",
      purchaserSeat: "NORTH",
      dealerSeat: "EAST",
      buyerOriginallyHeldAce: true,
      escalation,
      tricks: canonicalSunTricks("NORTH"),
      projectRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      projectQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      balootQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    });
    assert.equal(score.kabootTeamId, "NORTH_SOUTH");
    assert.equal(score.finalQaid.NORTH_SOUTH, 25);
    assert.equal(score.finalQaid.EAST_WEST, 0);
  }
});

test("Reverse Kaboot is 88 and is independent of ordinary escalation", () => {
  for (const escalation of ["NORMAL","DOUBLE"]) {
    const score = scoreRound({
      contract: "SUN",
      trumpSuit: null,
      purchaserSeat: "WEST",
      dealerSeat: "NORTH",
      buyerOriginallyHeldAce: true,
      escalation,
      tricks: canonicalSunTricks("NORTH"),
      projectRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      projectQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      balootQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    });
    assert.equal(score.reverseKaboot, true);
    assert.equal(score.finalQaid.NORTH_SOUTH, 88);
    assert.equal(score.finalQaid.EAST_WEST, 0);
  }
});

test("escalation follows the frozen NORMAL → DOUBLE → TRIPLE → FOUR → GAHWA chain", () => {
  let state = createEscalationState("HOKUM", "HOKUM_AFTER_COMPLETION_DEAL");
  assert.equal(canEscalate(state), true);
  state = escalate(state, "NORTH", "DOUBLE");
  assert.equal(state.level, "DOUBLE");
  assert.equal(state.initialDoublerSeat, "NORTH");
  state = escalate(state, "SOUTH", "TRIPLE");
  assert.equal(state.level, "TRIPLE");
  state = escalate(state, "NORTH", "FOUR");
  assert.equal(state.level, "FOUR");
  state = escalate(state, "SOUTH", "GAHWA");
  assert.equal(state.level, "GAHWA");
  assert.equal(canEscalate(state), false);
  assert.throws(() => escalate(state, "NORTH", "DOUBLE"), /Escalation/);
});

test("Sun escalation rejects TRIPLE and FOUR", () => {
  let state = createEscalationState("SUN", "SUN_CONTRACT_FINALIZED");
  state = escalate(state, "NORTH", "DOUBLE");
  assert.equal(state.level, "DOUBLE");
  assert.throws(() => escalate(state, "NORTH", "TRIPLE"), /Sun escalation/);
});

test("closing escalation freezes the final locked play mode", () => {
  const state = createEscalationState("HOKUM", "HOKUM_AFTER_COMPLETION_DEAL", "OPEN");
  const closed = closeEscalation(state, "LOCKED");
  assert.equal(closed.window, "CLOSED");
  assert.equal(closed.lockedPlayMode, "LOCKED");
  assert.equal(canEscalate(closed), false);
});


test("project overlap is rejected and exact ties use dealer-relative counter-clockwise priority", () => {
  const seraN = detectProjects(hand("CLUBS-7","CLUBS-8","CLUBS-9"), "SUN", null, "NORTH")[0];
  const seraE = detectProjects(hand("DIAMONDS-7","DIAMONDS-8","DIAMONDS-9"), "SUN", null, "EAST")[0];
  assert.ok(seraN && seraE);
  const first = declareProject(seraN, "p1", "PLAYING", 1, 0, []);
  assert.throws(
    () => declareProject(seraN, "p2", "PLAYING", 1, 0, [first]),
    /Project card overlap/,
  );
  const second = declareProject(seraE, "p2", "PLAYING", 1, 0, [first]);
  const resolution = resolveProjects([first, second], "NORTH");
  assert.equal(resolution.projectWinnerTeamId, "EAST_WEST");
});

test("project resolution awards every eligible project owned by the winning team", () => {
  const n1 = detectProjects(hand("CLUBS-7","CLUBS-8","CLUBS-9"), "SUN", null, "NORTH")[0];
  const n2 = detectProjects(hand("DIAMONDS-7","DIAMONDS-8","DIAMONDS-9"), "SUN", null, "NORTH")[0];
  const e = detectProjects(hand("HEARTS-7","HEARTS-8","HEARTS-9","HEARTS-10"), "SUN", null, "EAST")[0];
  assert.ok(n1 && n2 && e);
  const d1 = declareProject(n1, "n1", "PLAYING", 1, 0, []);
  const d2 = declareProject(n2, "n2", "PLAYING", 1, 0, [d1]);
  const de = declareProject(e, "e1", "PLAYING", 1, 0, [d1,d2]);
  const resolution = resolveProjects([d1,d2,de], "NORTH");
  assert.equal(resolution.projectWinnerTeamId, "EAST_WEST");
  assert.deepEqual(resolution.awardedProjectIds, [e.id]);
  assert.deepEqual(resolution.discardedProjectIds, [n1.id,n2.id]);
});

test("raw-to-Qaid conversion remains independently canonical at threshold and rounding edges", () => {
  assert.deepEqual(
    [0, 34, 35, 36, 81, 85, 86, 120, 162].map((n) => convertRawToQaid("HOKUM", n)),
    [0, 3, 3, 4, 8, 8, 9, 12, 16],
  );
  assert.deepEqual(
    [0, 34, 35, 36, 64, 65, 66, 100, 130].map((n) => convertRawToQaid("SUN", n)),
    [0, 6, 7, 8, 12, 13, 14, 20, 26],
  );
});

test("replay is deterministic and duplicate event IDs are idempotent", () => {
  const all = DECK.slice();
  const hands = {
    pN: all.slice(0,8), pE: all.slice(8,16), pS: all.slice(16,24), pW: all.slice(24,32),
  };
  const initial = legalState({
    hands,
    contract: "SUN",
    trumpSuit: null,
    currentPlayerId: "pN",
  });
  const event = { type: "CARD_PLAYED", eventId: "evt-1", playerId: "pN", cardId: hands.pN[0].id, ikaDeclared: false };
  const once = replay(initial, [event]);
  const twice = replay(initial, [event,event]);
  assert.deepEqual(twice, once);
});


test("second-round Sun is reserved for dealer-right with an Ace", () => {
  const dealer = "NORTH";
  const hands = {
    NORTH: ["CLUBS-7"],
    WEST: ["DIAMONDS-A"],
    SOUTH: ["HEARTS-7"],
    EAST: ["SPADES-A"],
  };
  let state = createBiddingState("r-bid", dealer);
  for (let i = 0; i < 4; i += 1) {
    state = applyBiddingAction(state, { type: "PASS", actionId: "p1-" + i }, dealer, "CLUBS-A", {
      "CLUBS-A": { suit: "CLUBS" },
    }, hands);
  }
  assert.equal(state.phase, "SECOND_ROUND");
  assert.equal(state.actingSeat, "WEST");
  assert.ok(legalBiddingActions(state, dealer, "CLUBS", hands).includes("BUY_SUN"));
  const noAce = { ...hands, WEST: ["DIAMONDS-7"] };
  assert.ok(!legalBiddingActions(state, dealer, "CLUBS", noAce).includes("BUY_SUN"));
  const eastState = { ...state, actingSeat: "EAST" };
  assert.ok(!legalBiddingActions(eastState, dealer, "CLUBS", hands).includes("BUY_SUN"));
  assert.throws(
    () => applyBiddingAction(eastState, { type: "BUY_SUN", actionId: "sun-east" }, dealer, "CLUBS-A", {
      "CLUBS-A": { suit: "CLUBS" },
    }, hands),
    /dealer-right Ace priority/,
  );
});


test("bidding timeout becomes an authoritative PASS after 8 seconds", () => {
  const dealer = "NORTH";
  const hands = {
    NORTH: ["CLUBS-7"],
    WEST: ["DIAMONDS-7"],
    SOUTH: ["HEARTS-7"],
    EAST: ["SPADES-7"],
  };
  const state = createBiddingState("r-timeout", dealer);
  assert.throws(
    () => applyBiddingTimeout(state, dealer, BIDDING_TIMEOUT_MS - 1, "timeout-early"),
    /timeout has not elapsed/,
  );
  const next = applyBiddingTimeout(state, dealer, BIDDING_TIMEOUT_MS, "timeout-1");
  assert.equal(next.actingSeat, "SOUTH");
  assert.equal(next.passCount, 1);
  assert.equal(next.history[0].action, "PASS");
  assert.equal(next.history[0].actionId, "timeout-1");
  assert.equal(applyBiddingTimeout(next, dealer, BIDDING_TIMEOUT_MS, "timeout-1").stateVersion, next.stateVersion);
});

test("Kasho qualifies on five 7/8/9 cards, is first-bidding only, and is idempotent", () => {
  const kashoCards = hand("CLUBS-7","DIAMONDS-8","HEARTS-9","SPADES-7","CLUBS-8");
  assert.equal(qualifiesForKasho(kashoCards), true);
  assert.equal(canDeclareKasho(kashoCards, "FIRST_BIDDING", false), true);
  assert.equal(canDeclareKasho(kashoCards, "FIRST_BIDDING", true), false);
  assert.equal(canDeclareKasho(kashoCards, "SECOND_BIDDING", false), false);

  const declaration = declareKasho("k-1", "NORTH", kashoCards, "FIRST_BIDDING", false);
  assert.equal(declaration.teamId, "NORTH_SOUTH");
  assert.equal(declaration.cardIds.length, 5);

  const resolution = resolveKasho(declaration, "NORTH");
  assert.deepEqual(
    {
      status: resolution.status,
      reason: resolution.reason,
      scoreAwarded: resolution.scoreAwarded,
      roundScore: resolution.roundScore,
      matchScoreUnchanged: resolution.matchScoreUnchanged,
      nextDealerSeat: resolution.nextDealerSeat,
    },
    {
      status: "CANCELLED",
      reason: "KASHO",
      scoreAwarded: false,
      roundScore: null,
      matchScoreUnchanged: true,
      nextDealerSeat: "WEST",
    },
  );
  assert.deepEqual(resolveKasho(declaration, "NORTH"), resolution);
});

test("bidding Kasho is available after PASS, cancels immediately, and rotates dealer right", () => {
  const dealer = "NORTH";
  const hands = {
    NORTH: ["CLUBS-7","DIAMONDS-8","HEARTS-9","SPADES-7","CLUBS-8"],
    WEST: ["DIAMONDS-7"],
    SOUTH: ["HEARTS-7"],
    EAST: ["SPADES-7"],
  };
  let state = createBiddingState("r-kasho", dealer);
  assert.ok(!legalBiddingActions(state, dealer, "CLUBS", hands).includes("DECLARE_KASHO"));

  state = applyBiddingAction(
    state,
    { type: "PASS", actionId: "k-pass" },
    dealer,
    "CLUBS-A",
    { "CLUBS-A": { suit: "CLUBS" } },
    hands,
  );
  assert.equal(state.phase, "FIRST_ROUND");
  assert.equal(state.actingSeat, "SOUTH");
  assert.ok(!legalBiddingActions(state, dealer, "CLUBS", hands).includes("DECLARE_KASHO"));

  const kashoHands = {
    ...hands,
    SOUTH: ["CLUBS-7","DIAMONDS-8","HEARTS-9","SPADES-7","CLUBS-8"],
  };
  assert.ok(legalBiddingActions(state, dealer, "CLUBS", kashoHands).includes("DECLARE_KASHO"));
  const cancelled = applyBiddingAction(
    state,
    { type: "DECLARE_KASHO", actionId: "k-declare" },
    dealer,
    "CLUBS-A",
    { "CLUBS-A": { suit: "CLUBS" } },
    kashoHands,
  );
  assert.equal(cancelled.phase, "CANCELLED");
  assert.equal(cancelled.cancellationReason, "KASHO");
  assert.equal(cancelled.nextDealerSeat, "WEST");
  assert.deepEqual(
    applyBiddingAction(
      cancelled,
      { type: "DECLARE_KASHO", actionId: "k-declare" },
      dealer,
      "CLUBS-A",
      { "CLUBS-A": { suit: "CLUBS" } },
      kashoHands,
    ),
    cancelled,
  );
});


test("integrity incidents follow the frozen authority matrix and cancel at 0-0", () => {
  const exposure = createIntegrityIncident("inc-1", "ACCIDENTAL_EXPOSURE", "NORTH_SOUTH");
  assert.equal(exposure.authority, "AFFECTED_OPPOSING_TEAM");
  assert.equal(exposure.phase, "DECISION_REQUIRED");
  const continued = resolveIntegrityIncident(exposure, "CONTINUE", "NORTH");
  assert.equal(continued.outcome, "CONTINUED");
  assert.equal(continued.nextDealerSeat, null);

  const wrongCount = createIntegrityIncident("inc-2", "WRONG_CARD_COUNT", "EAST_WEST");
  const cancelled = resolveIntegrityIncident(wrongCount, "CANCEL", "NORTH");
  assert.equal(cancelled.outcome, "HAND_CANCELLED");
  assert.deepEqual(cancelled.score, { NORTH_SOUTH: 0, EAST_WEST: 0 });
  assert.equal(cancelled.matchScoreUnchanged, true);
  assert.equal(cancelled.nextDealerSeat, "WEST");

  const impossible = createIntegrityIncident("inc-3", "DUPLICATE_OR_IMPOSSIBLE_DECK");
  assert.equal(impossible.authority, "SERVER");
  assert.equal(impossible.autoCancel, true);
  const autoCancelled = resolveIntegrityIncident(impossible, null, "WEST");
  assert.equal(autoCancelled.outcome, "HAND_CANCELLED");
  assert.equal(autoCancelled.nextDealerSeat, "SOUTH");
  assert.throws(() => resolveIntegrityIncident(impossible, "CANCEL", "WEST"), /Auto-cancel/);
});

test("invalid client requests remain ordinary rejections, not integrity incidents", () => {
  const state = createBiddingState("r-invalid", "NORTH");
  const hands = {
    NORTH: ["CLUBS-7"],
    WEST: ["DIAMONDS-7"],
    SOUTH: ["HEARTS-7"],
    EAST: ["SPADES-7"],
  };
  assert.throws(
    () => applyBiddingAction(
      state,
      { type: "DECLARE_KASHO", actionId: "not-eligible" },
      "NORTH",
      "CLUBS-A",
      { "CLUBS-A": { suit: "CLUBS" } },
      hands,
    ),
    /Kasho requires five/,
  );
  assert.equal(state.phase, "FIRST_ROUND");
});

test("full trick lifecycle completes exactly eight tricks and enters ROUND_COMPLETE", () => {
  const players = { pN: "NORTH", pW: "WEST", pS: "SOUTH", pE: "EAST" };
  const hands = {
    pN: hand(
      "CLUBS-A","CLUBS-K","DIAMONDS-A","DIAMONDS-K",
      "HEARTS-A","HEARTS-K","SPADES-A","SPADES-K",
    ),
    pW: hand(
      "CLUBS-Q","CLUBS-J","DIAMONDS-Q","DIAMONDS-J",
      "HEARTS-Q","HEARTS-J","SPADES-Q","SPADES-J",
    ),
    pS: hand(
      "CLUBS-10","CLUBS-9","DIAMONDS-10","DIAMONDS-9",
      "HEARTS-10","HEARTS-9","SPADES-10","SPADES-9",
    ),
    pE: hand(
      "CLUBS-8","CLUBS-7","DIAMONDS-8","DIAMONDS-7",
      "HEARTS-8","HEARTS-7","SPADES-8","SPADES-7",
    ),
  };

  let state = legalState({
    currentPlayerId: "pN",
    players,
    hands,
    contract: "SUN",
    trumpSuit: null,
    dealerSeat: "EAST",
  });

  const suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
  for (const suit of suits) {
    for (const high of [true, false]) {
      const ranks = high
        ? ["A", "Q", "10", "8"]
        : ["K", "J", "9", "7"];
      const ids = ranks.map((rank) => `${suit}-${rank}`);
      for (const [playerId, id] of [
        ["pN", ids[0]],
        ["pW", ids[1]],
        ["pS", ids[2]],
        ["pE", ids[3]],
      ]) {
        assert.equal(state.currentPlayerId, playerId);
        state = applyCardPlay(state, playerId, id);
      }
      assert.equal(state.currentTrick.length, 0);
      assert.equal(state.completedTricks.length, suits.indexOf(suit) * 2 + (high ? 1 : 2));
      assert.equal(state.currentPlayerId, "pN");
    }
  }

  assert.equal(state.phase, "ROUND_COMPLETE");
  assert.equal(state.completedTricks.length, 8);
  assert.equal(state.currentTrick.length, 0);
  for (const playerId of Object.keys(players)) {
    assert.equal(state.hands[playerId].length, 0);
  }
  assert.equal(state.currentPlayerId, "pN");
  assert.deepEqual(
    state.completedTricks.map((trick) => trick.trickNumber),
    [1,2,3,4,5,6,7,8],
  );
  assert.ok(state.completedTricks.every((trick) => trick.winnerSeat === "NORTH"));
});

test("completed eight-trick round resolves through the canonical scoring engine", () => {
  const players = { pN: "NORTH", pW: "WEST", pS: "SOUTH", pE: "EAST" };
  const hands = {
    pN: hand(
      "CLUBS-A","CLUBS-K","DIAMONDS-A","DIAMONDS-K",
      "HEARTS-A","HEARTS-K","SPADES-A","SPADES-K",
    ),
    pW: hand(
      "CLUBS-Q","CLUBS-J","DIAMONDS-Q","DIAMONDS-J",
      "HEARTS-Q","HEARTS-J","SPADES-Q","SPADES-J",
    ),
    pS: hand(
      "CLUBS-10","CLUBS-9","DIAMONDS-10","DIAMONDS-9",
      "HEARTS-10","HEARTS-9","SPADES-10","SPADES-9",
    ),
    pE: hand(
      "CLUBS-8","CLUBS-7","DIAMONDS-8","DIAMONDS-7",
      "HEARTS-8","HEARTS-7","SPADES-8","SPADES-7",
    ),
  };

  let state = legalState({
    currentPlayerId: "pN",
    players,
    hands,
    contract: "SUN",
    trumpSuit: null,
    dealerSeat: "EAST",
  });

  for (const suit of ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"]) {
    for (const high of [true, false]) {
      const ranks = high ? ["A", "Q", "10", "8"] : ["K", "J", "9", "7"];
      const ids = ranks.map((rank) => `${suit}-${rank}`);
      for (const [playerId, id] of [["pN", ids[0]], ["pW", ids[1]], ["pS", ids[2]], ["pE", ids[3]]]) {
        state = applyCardPlay(state, playerId, id);
      }
    }
  }

  assert.equal(state.phase, "ROUND_COMPLETE");
  const score = scoreRound({
    contract: "SUN",
    trumpSuit: null,
    purchaserSeat: "NORTH",
    dealerSeat: "EAST",
    buyerOriginallyHeldAce: true,
    escalation: "NORMAL",
    tricks: state.completedTricks,
    projectRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    projectQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
  });

  assert.deepEqual(score.cardRaw, { NORTH_SOUTH: 110, EAST_WEST: 20 });
  assert.equal(score.contractResult, "SUCCESS");
  assert.equal(score.kabootTeamId, "NORTH_SOUTH");
  assert.deepEqual(score.finalQaid, { NORTH_SOUTH: 26, EAST_WEST: 0 });
});

test("completed round rejects further card-play through the authoritative phase guard", () => {
  const state = legalState({
    phase: "ROUND_COMPLETE",
    currentPlayerId: "pN",
    hands: {
      pN: hand("CLUBS-A"),
      pE: [],
      pS: [],
      pW: [],
    },
    completedTricks: Array.from({ length: 8 }, (_, index) => ({
      trickNumber: index + 1,
      leaderSeat: "NORTH",
      plays: [],
      winnerSeat: "NORTH",
    })),
  });
  assert.throws(() => applyCardPlay(state, "pN", "CLUBS-A"), /PLAYING phase/);
});
