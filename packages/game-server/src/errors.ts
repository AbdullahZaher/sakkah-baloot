export const ServerErrorCode = {
  UNKNOWN_PLAYER: "UNKNOWN_PLAYER",
  INVALID_MATCH: "INVALID_MATCH",
  INVALID_ROUND: "INVALID_ROUND",
  STALE_STATE_VERSION: "STALE_STATE_VERSION",
  FUTURE_STATE_VERSION: "FUTURE_STATE_VERSION",
  DUPLICATE_ACTION: "DUPLICATE_ACTION",
  NOT_YOUR_TURN: "NOT_YOUR_TURN",
  ILLEGAL_ACTION: "ILLEGAL_ACTION",
  INVALID_ACTION_ID: "INVALID_ACTION_ID",
  MATCH_FINISHED: "MATCH_FINISHED",
  ROUND_FINISHED: "ROUND_FINISHED",
  ROUND_NOT_FINISHED: "ROUND_NOT_FINISHED",
  SEAT_ALREADY_OCCUPIED: "SEAT_ALREADY_OCCUPIED",
  PLAYER_ALREADY_SEATED: "PLAYER_ALREADY_SEATED",
  RESUME_UNAVAILABLE: "RESUME_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ServerErrorCode = (typeof ServerErrorCode)[keyof typeof ServerErrorCode];

export class ServerBoundaryError extends Error {
  public readonly code: ServerErrorCode;
  public readonly details?: unknown;

  constructor(code: ServerErrorCode, message: string, details?: unknown) {
    super(`[${code}] ${message}`);
    this.name = "ServerBoundaryError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ServerBoundaryError.prototype);
  }
}
