import type { PlayerId, Seat } from "@sakkah-baloot/game-engine";
import { SEATS } from "@sakkah-baloot/game-engine";
import { ServerBoundaryError, ServerErrorCode } from "./errors.js";

export class SeatRouter {
  private readonly seatToPlayer: Record<Seat, PlayerId>;
  private readonly playerToSeat: Map<PlayerId, Seat>;

  constructor(bindings: Readonly<Record<Seat, PlayerId>>) {
    this.seatToPlayer = { ...bindings };
    this.playerToSeat = new Map();

    for (const seat of SEATS) {
      const playerId = bindings[seat];
      if (!playerId || typeof playerId !== "string" || playerId.trim() === "") {
        throw new ServerBoundaryError(
          ServerErrorCode.INTERNAL_ERROR,
          `Seat ${seat} must be bound to a valid player ID`,
        );
      }
      if (this.playerToSeat.has(playerId)) {
        throw new ServerBoundaryError(
          ServerErrorCode.PLAYER_ALREADY_SEATED,
          `Player ${playerId} is already seated at ${this.playerToSeat.get(playerId)}`,
        );
      }
      this.playerToSeat.set(playerId, seat);
    }
  }

  public getSeat(playerId: PlayerId): Seat {
    const seat = this.playerToSeat.get(playerId);
    if (!seat) {
      throw new ServerBoundaryError(
        ServerErrorCode.UNKNOWN_PLAYER,
        `Player ${playerId} is not part of this match`,
      );
    }
    return seat;
  }

  public getPlayer(seat: Seat): PlayerId {
    const player = this.seatToPlayer[seat];
    if (!player) {
      throw new ServerBoundaryError(
        ServerErrorCode.INTERNAL_ERROR,
        `Seat ${seat} is unbound`,
      );
    }
    return player;
  }

  public isPlayerSeated(playerId: PlayerId): boolean {
    return this.playerToSeat.has(playerId);
  }

  public getAllBindings(): Readonly<Record<Seat, PlayerId>> {
    return { ...this.seatToPlayer };
  }

  public getPlayerMap(): Readonly<Record<PlayerId, Seat>> {
    return Object.fromEntries(this.playerToSeat.entries()) as Record<PlayerId, Seat>;
  }
}
