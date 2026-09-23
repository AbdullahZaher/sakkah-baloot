import type {
  BiddingAction,
  CardId,
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

export interface ProtocolReplayResult {
  readonly state: MatchProtocolState;
  readonly appliedEventIds: readonly string[];
}

export function deterministicEventId(
  matchId: string,
  stateVersion: number,
  event: MatchProtocolEvent,
): string {
  const roundId = "roundId" in event ? event.roundId : "MATCH";
  return `${matchId}:v${stateVersion}:${event.type}:${roundId}`;
}

export function applyProtocolEvent(
  state: MatchProtocolState,
  envelope: ServerEventEnvelope<MatchProtocolEvent>,
  processedEventIds: readonly string[] = [],
): ProtocolReplayResult {
  if (envelope.matchId !== state.matchId) {
    throw new Error("Protocol event belongs to another match");
  }

  if (processedEventIds.includes(envelope.eventId)) {
    return { state, appliedEventIds: processedEventIds };
  }

  if (envelope.stateVersion !== state.stateVersion + 1) {
    throw new Error("Protocol event state version is not sequential");
  }

  const event = envelope.event;
  if ("roundId" in event && event.roundId !== state.roundId && event.type !== "NEXT_ROUND") {
    throw new Error("Protocol event belongs to another round");
  }

  const nextPhase = protocolPhaseForEvent(event);
  const score = event.type === "ROUND_COMPLETE" || event.type === "MATCH_COMPLETE"
    ? event.score
    : state.score;

  const next: MatchProtocolState = {
    ...state,
    stateVersion: envelope.stateVersion,
    phase: nextPhase,
    roundId: event.type === "NEXT_ROUND" ? event.roundId : state.roundId,
    roundNumber: event.type === "NEXT_ROUND" ? event.nextRoundNumber : state.roundNumber,
    dealerSeat: event.type === "DEAL"
      ? event.dealerSeat
      : event.type === "NEXT_ROUND"
        ? event.dealerSeat
        : state.dealerSeat,
    score,
  };

  return {
    state: next,
    appliedEventIds: [...processedEventIds, envelope.eventId],
  };
}

export function replayProtocol(
  initialState: MatchProtocolState,
  events: readonly ServerEventEnvelope<MatchProtocolEvent>[],
): ProtocolReplayResult {
  let result: ProtocolReplayResult = { state: initialState, appliedEventIds: [] };
  for (const event of events) {
    result = applyProtocolEvent(result.state, event, result.appliedEventIds);
  }
  return result;
}

function protocolPhaseForEvent(event: MatchProtocolEvent): MatchProtocolState["phase"] {
  switch (event.type) {
    case "DEAL":
      return "DEAL";
    case "BID":
      return "BID";
    case "PROJECT":
      return "PROJECT";
    case "PLAY_CARD":
      return "PLAY_CARD";
    case "TRICK_COMPLETE":
      return "TRICK_COMPLETE";
    case "ROUND_COMPLETE":
      return "ROUND_COMPLETE";
    case "NEXT_ROUND":
      return "NEXT_ROUND";
    case "MATCH_COMPLETE":
      return "MATCH_COMPLETE";
  }
}
