import type {
  BiddingAction,
  CardId,
  Contract,
  EscalationLevel,
  MatchEndResult,
  MatchScore,
  PlayerId,
  ProjectType,
  Seat,
  Suit,
  TeamId,
} from "@sakkah-baloot/game-engine";

export interface ClientActionEnvelope<TAction = unknown> {
  readonly matchId: string;
  readonly actionId: string;
  readonly playerId: string;
  readonly expectedStateVersion: number;
  readonly action: TAction;
}

export interface ServerEventEnvelope<TEvent = unknown> {
  readonly matchId: string;
  readonly eventId: string;
  readonly stateVersion: number;
  readonly event: TEvent;
}

export interface StateSnapshot<TState = unknown> {
  readonly matchId: string;
  readonly stateVersion: number;
  readonly state: TState;
}

export type MatchProtocolEvent =
  | DealEvent
  | BidEvent
  | PlayCardEvent
  | ProjectEvent
  | TrickCompleteEvent
  | RoundCompleteEvent
  | NextRoundEvent
  | MatchCompleteEvent;

export interface DealEvent {
  readonly type: "DEAL";
  readonly roundId: string;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
}

export interface BidEvent {
  readonly type: "BID";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly action: BiddingAction;
}

export interface PlayCardEvent {
  readonly type: "PLAY_CARD";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly cardId: CardId;
  readonly ikaDeclared: boolean;
}

export interface ProjectEvent {
  readonly type: "PROJECT";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly project: ProjectType;
  readonly suit: Suit | null;
}

export interface TrickCompleteEvent {
  readonly type: "TRICK_COMPLETE";
  readonly roundId: string;
  readonly trickNumber: number;
  readonly winnerSeat: Seat;
}

export interface RoundCompleteEvent {
  readonly type: "ROUND_COMPLETE";
  readonly roundId: string;
  readonly score: MatchScore;
  readonly matchEnd: MatchEndResult;
}

export interface NextRoundEvent {
  readonly type: "NEXT_ROUND";
  readonly roundId: string;
  readonly nextRoundNumber: number;
  readonly dealerSeat: Seat;
}

export interface MatchCompleteEvent {
  readonly type: "MATCH_COMPLETE";
  readonly score: MatchScore;
  readonly winnerTeamId: TeamId;
}

export interface MatchProtocolState {
  readonly matchId: string;
  readonly stateVersion: number;
  readonly roundId: string;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly phase:
    | "DEAL"
    | "BID"
    | "PLAY_CARD"
    | "PROJECT"
    | "TRICK_COMPLETE"
    | "ROUND_COMPLETE"
    | "NEXT_ROUND"
    | "MATCH_COMPLETE";
  readonly score: MatchScore;
  readonly escalation: EscalationLevel;
}


export function deterministicEventId(
  matchId: string,
  stateVersion: number,
  event: MatchProtocolEvent,
): string {
  return `${matchId}:v${stateVersion}:${event.type}:${event.roundId}`;
}
