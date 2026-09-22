import type { CardId, Seat } from "../cards.js";
import { CARDS_PER_PLAYER, SEATS } from "../rules/types.js";
import type { MatchSeed, RoundId } from "../rules/types.js";
import { nextCounterClockwise } from "../rules/profile.js";
import { DECK } from "../cards.js";

export interface RandomSource {
  next(): number;
}

export interface DealTranscript {
  readonly ruleProfileId: string;
  readonly dealerSeat: Seat;
  readonly initialDeckOrder: readonly CardId[];
  readonly initialHands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly exposedCardId: CardId;
  readonly completionHands?: Readonly<Record<Seat, readonly CardId[]>>;
}

export interface DealState {
  readonly roundId: RoundId;
  readonly dealerSeat: Seat;
  readonly phase: "INITIAL_DEAL" | "BIDDING_READY" | "COMPLETION_DEAL" | "DEAL_COMPLETE";
  readonly deck: readonly CardId[];
  readonly hands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly exposedCardId: CardId | null;
  readonly transcript: DealTranscript;
}

function assertSeatRecord<T>(record: Readonly<Record<Seat, readonly T[]>>): void {
  for (const seat of SEATS) {
    if (!record[seat]) throw new Error(`Missing seat: ${seat}`);
  }
}

function assertUnique(ids: readonly CardId[]): void {
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate card detected");
}

export function createSeededRandom(seed: MatchSeed): RandomSource {
  let state = hashSeed(seed);
  return {
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

export function shuffleDeck(random: RandomSource): readonly CardId[] {
  const cards = DECK.map((card) => card.id);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

function emptyHands(): Record<Seat, CardId[]> {
  return { NORTH: [], EAST: [], SOUTH: [], WEST: [] };
}

export function getFirstDealer(matchSeed: MatchSeed): Seat {
  const random = createSeededRandom(matchSeed);
  return SEATS[Math.floor(random.next() * SEATS.length)]!;
}

export function rotateDealer(dealerSeat: Seat): Seat {
  return nextCounterClockwise(dealerSeat);
}

function dealInitial(
  deck: readonly CardId[],
  dealerSeat: Seat,
): { hands: Record<Seat, CardId[]>; remainder: CardId[] } {
  const hands = emptyHands();
  let cursor = 0;
  const firstReceiver = nextCounterClockwise(dealerSeat);
  const order = [firstReceiver, ...Array.from({ length: 3 }, (_, i) => {
    let seat = firstReceiver;
    for (let j = 0; j < i + 1; j += 1) seat = nextCounterClockwise(seat);
    return seat;
  })];

  // Frozen initial distribution is 3 + 2, round-robin in counter-clockwise seat order.
  for (let pass = 0; pass < 2; pass += 1) {
    const count = pass === 0 ? 3 : 2;
    for (let card = 0; card < count; card += 1) {
      for (const seat of order) hands[seat].push(deck[cursor++]!);
    }
  }
  return { hands, remainder: deck.slice(cursor) as CardId[] };
}

export function createInitialDeal(
  roundId: RoundId,
  dealerSeat: Seat,
  random: RandomSource,
  ruleProfileId = "saudi-v1",
): DealState {
  const deck = shuffleDeck(random);
  const { hands, remainder } = dealInitial(deck, dealerSeat);
  const exposedCardId = remainder.shift();
  if (!exposedCardId) throw new Error("Unable to expose card");

  const initialHands = {
    NORTH: [...hands.NORTH],
    EAST: [...hands.EAST],
    SOUTH: [...hands.SOUTH],
    WEST: [...hands.WEST],
  } as const;

  const transcript: DealTranscript = {
    ruleProfileId,
    dealerSeat,
    initialDeckOrder: [...deck],
    initialHands,
    exposedCardId,
  };

  const state: DealState = {
    roundId,
    dealerSeat,
    phase: "BIDDING_READY",
    deck: remainder,
    hands: initialHands,
    exposedCardId,
    transcript,
  };

  validateDealState(state);
  return state;
}

export function completeDeal(
  state: DealState,
  exposedCardReceiverSeat: Seat,
): DealState {
  if (state.phase !== "BIDDING_READY") throw new Error("Completion deal is not available");
  if (state.exposedCardId === null) throw new Error("No exposed card available");
  if (state.deck.length !== 11) throw new Error("Invalid completion deck size");

  const hands = {
    NORTH: [...state.hands.NORTH],
    EAST: [...state.hands.EAST],
    SOUTH: [...state.hands.SOUTH],
    WEST: [...state.hands.WEST],
  };

  // The exposed card is transferred to the purchaser/receiver first, then the
  // remaining 11 hidden cards are distributed: receiver gets 2, others get 3.
  hands[exposedCardReceiverSeat].push(state.exposedCardId);
  const firstReceiver = nextCounterClockwise(state.dealerSeat);
  const distributionOrder = [firstReceiver, ...Array.from({ length: 3 }, (_, i) => {
    let seat = firstReceiver;
    for (let j = 0; j < i + 1; j += 1) seat = nextCounterClockwise(seat);
    return seat;
  })];
  const remainingSeats = distributionOrder.filter((seat) => seat !== exposedCardReceiverSeat);
  let cursor = 0;

  for (let i = 0; i < 2; i += 1) {
    hands[exposedCardReceiverSeat].push(state.deck[cursor++]!);
  }
  for (const seat of remainingSeats) {
    for (let i = 0; i < 3; i += 1) hands[seat].push(state.deck[cursor++]!);
  }

  const completionHands = {
    NORTH: [...hands.NORTH],
    EAST: [...hands.EAST],
    SOUTH: [...hands.SOUTH],
    WEST: [...hands.WEST],
  } as const;

  const next: DealState = {
    ...state,
    phase: "DEAL_COMPLETE",
    deck: [],
    hands: completionHands,
    exposedCardId: null,
    transcript: {
      ...state.transcript,
      completionHands,
    },
  };

  validateDealState(next);
  return next;
}

export function validateDealState(state: DealState): void {
  assertSeatRecord(state.hands);
  const all = [
    ...Object.values(state.hands).flat(),
    ...state.deck,
    ...(state.exposedCardId ? [state.exposedCardId] : []),
  ];
  assertUnique(all);

  if (all.length !== 32) throw new Error(`Card conservation violated: ${all.length}`);

  if (state.phase === "BIDDING_READY") {
    for (const seat of SEATS) {
      if (state.hands[seat].length !== 5) {
        throw new Error(`Invalid initial hand size for ${seat}`);
      }
    }
    if (state.deck.length !== 11 || state.exposedCardId === null) {
      throw new Error("Invalid bidding-ready zones");
    }
  }

  if (state.phase === "DEAL_COMPLETE") {
    for (const seat of SEATS) {
      if (state.hands[seat].length !== CARDS_PER_PLAYER) {
        throw new Error(`Invalid completed hand size for ${seat}`);
      }
    }
    if (state.deck.length !== 0 || state.exposedCardId !== null) {
      throw new Error("Invalid completed deal zones");
    }
  }
}
