import type { CardId, Suit } from "../cards.js";
import type { Seat } from "../rules/types.js";
import { SEATS } from "../rules/types.js";
import type { Contract, RoundId } from "../rules/types.js";
import {
  nextCounterClockwise,
  previousCounterClockwise,
  partnerOfSeat,
} from "../rules/profile.js";
import type { DealState } from "../dealing/deal-engine.js";
import { completeDeal } from "../dealing/deal-engine.js";

export const BIDDING_TIMEOUT_MS = 8_000;

export type BiddingPhase = "FIRST_ROUND" | "SECOND_ROUND" | "CONTRACT_SELECTED" | "CANCELLED";

export type BiddingAction =
  | { readonly type: "PASS"; readonly actionId: string }
  | { readonly type: "DECLARE_KASHO"; readonly actionId: string }
  | { readonly type: "BUY_HOKUM_EXPOSED"; readonly actionId: string }
  | { readonly type: "BUY_SUN"; readonly actionId: string }
  | { readonly type: "BUY_ASHKAL"; readonly actionId: string }
  | { readonly type: "BUY_HOKUM"; readonly actionId: string; readonly suit: Suit };

export interface SelectedContract {
  readonly contract: Contract;
  readonly purchaserSeat: Seat;
  readonly source: "FIRST_ROUND" | "SECOND_ROUND";
  readonly trumpSuit: Suit | null;
  readonly mode: "NORMAL" | "ASHKAL";
  readonly exposedCardReceiverSeat: Seat;
}

export interface BiddingActionRecord {
  readonly actionId: string;
  readonly turnNumber: number;
  readonly seat: Seat;
  readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
  readonly action: BiddingAction["type"];
  readonly stateVersion: number;
}

export type BiddingHands = Readonly<Record<Seat, readonly CardId[]>>;

export interface BiddingState {
  readonly roundId: RoundId;
  readonly phase: BiddingPhase;
  readonly actingSeat: Seat;
  readonly turnNumber: number;
  readonly passCount: number;
  readonly stateVersion: number;
  readonly selectedContract: SelectedContract | null;
  readonly history: readonly BiddingActionRecord[];
  readonly processedActionIds: readonly string[];
  readonly cancellationReason: "NONE" | "KASHO" | "ALL_PASS";
  readonly nextDealerSeat: Seat | null;
}

export function createBiddingState(
  roundId: RoundId,
  dealerSeat: Seat,
): BiddingState {
  return {
    roundId,
    phase: "FIRST_ROUND",
    actingSeat: nextCounterClockwise(dealerSeat),
    turnNumber: 0,
    passCount: 0,
    stateVersion: 0,
    selectedContract: null,
    history: [],
    processedActionIds: [],
    cancellationReason: "NONE",
    nextDealerSeat: null,
  };
}

function hasProcessed(state: BiddingState, actionId: string): boolean {
  return state.processedActionIds.includes(actionId);
}

export function applyBiddingAction(
  state: BiddingState,
  action: BiddingAction,
  dealerSeat: Seat,
  exposedCardId: CardId | null,
  cards: Readonly<Record<CardId, { readonly suit: Suit }>> | null,
  hands: BiddingHands = { NORTH: [], EAST: [], SOUTH: [], WEST: [] },
): BiddingState {
  if (hasProcessed(state, action.actionId)) return state;
  if (state.phase !== "FIRST_ROUND" && state.phase !== "SECOND_ROUND") {
    throw new Error("Bidding is not active");
  }

  const exposedSuit = exposedCardId === null || cards === null
    ? null
    : cards[exposedCardId]?.suit ?? null;
  if (state.actingSeat === undefined) throw new Error("Missing acting seat");

  if (action.type === "DECLARE_KASHO") {
    if (state.phase !== "FIRST_ROUND") throw new Error("Kasho is only available during first bidding");
    const actingHand = hands[state.actingSeat] ?? [];
    const kashoCount = actingHand.filter((id) => /-(7|8|9)$/.test(id)).length;
    if (kashoCount < 5) throw new Error("Kasho requires five cards of ranks 7/8/9");
    const historyEntry: BiddingActionRecord = {
      actionId: action.actionId,
      turnNumber: state.turnNumber,
      seat: state.actingSeat,
      phase: "FIRST_ROUND",
      action: action.type,
      stateVersion: state.stateVersion + 1,
    };
    return {
      ...state,
      phase: "CANCELLED",
      stateVersion: state.stateVersion + 1,
      history: [...state.history, historyEntry],
      processedActionIds: [...state.processedActionIds, action.actionId],
      cancellationReason: "KASHO",
      nextDealerSeat: nextCounterClockwise(dealerSeat),
    };
  }

  if (action.type === "PASS") {