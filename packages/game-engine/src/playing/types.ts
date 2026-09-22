import type { CardId, PlayerId, Seat, Contract, HokumPlayMode } from "../rules/types.js";
import type { Card, Suit } from "../cards.js";

export interface CompletedTrick {
  readonly trickNumber: number;
  readonly leaderSeat: Seat;
  readonly plays: readonly TrickPlay[];
  readonly winnerSeat: Seat;
}

export interface TrickPlay {
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly card: Card;
  readonly ikaDeclared: boolean;
  readonly sequence: number;
}

export interface LegalMoveState {
  readonly phase: "PLAYING" | "ROUND_COMPLETE";
  readonly currentPlayerId: PlayerId;
  readonly players: Readonly<Record<PlayerId, Seat>>;
  readonly hands: Readonly<Record<PlayerId, readonly Card[]>>;
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
  readonly hokumPlayMode: HokumPlayMode;
  readonly dealerSeat: Seat;
  readonly trickNumber: number;
  readonly currentTrick: readonly TrickPlay[];
  readonly completedTricks: readonly CompletedTrick[];
}

export type MoveConstraint = "FOLLOW_SUIT" | "IKA_FREE_PLAY" | "MUST_TRUMP" | "MUST_OVERTRUMP" | "ANY_CARD";

export interface LegalMove {
  readonly cardId: CardId;
  readonly allowed: true;
  readonly constraint?: MoveConstraint;
}

export type GameState = LegalMoveState;
