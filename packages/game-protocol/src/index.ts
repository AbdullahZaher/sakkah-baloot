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
