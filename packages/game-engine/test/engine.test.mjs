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
    currentPlayerId: "pW",
    hands: {
      pN: hand("CLUBS-A"),
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-K"),
      pW: hand("HEARTS-8","SPADES-A"),
    },
    currentTrick: [
      { playerId: "pN", seat: "NORTH", card: card("CLUBS-A"), ikaDeclared: false, sequence: 1 },
      { playerId: "pE", seat: "EAST", card: card("DIAMONDS-7"), ikaDeclared: false, sequence: 2 },
      { playerId: "pS", seat: "SOUTH", card: card("HEARTS-K"), ikaDeclared: false, sequence: 3 },
    ],
  });
  assert.deepEqual(getLegalMoves(state, "pW").map((m) => m.cardId), ["HEARTS-8","SPADES-A"]);
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
      pE: hand("DIAMONDS-7"),
      pS: hand("HEARTS-7"),
      pW: hand("SPADES-7"),
    },
  });
  const s1 = applyCardPlay(state, "pN", "CLUBS-A");
  const s2 = applyCardPlay(s1, "pW", "SPADES-7");
  const s3 = applyCardPlay(s2, "pS", "HEARTS-7");
  const s4 = applyCardPlay(s3, "pE", "DIAMONDS-7");
  assert.equal(s4.completedTricks[0].winnerSeat, "NORTH");
  assert.equal(s4.currentPlayerId, "pN");
});
