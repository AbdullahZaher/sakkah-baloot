import type {
  MatchProtocolEvent,
  ServerEventEnvelope,
} from "@sakkah-baloot/game-protocol";
import { ServerBoundaryError, ServerErrorCode } from "./errors.js";

export class EventStore {
  private readonly events: ServerEventEnvelope<MatchProtocolEvent>[] = [];

  public append(envelope: ServerEventEnvelope<MatchProtocolEvent>): void {
    const expectedNextVersion =
      this.events.length === 0
        ? 1
        : this.events[this.events.length - 1]!.stateVersion + 1;

    if (envelope.stateVersion !== expectedNextVersion) {
      throw new ServerBoundaryError(
        ServerErrorCode.INTERNAL_ERROR,
        `Event version mismatch: expected ${expectedNextVersion}, got ${envelope.stateVersion}`,
      );
    }

    this.events.push(envelope);
  }

  public appendMany(
    envelopes: readonly ServerEventEnvelope<MatchProtocolEvent>[],
  ): void {
    for (const envelope of envelopes) {
      this.append(envelope);
    }
  }

  public getEventsAfter(
    version: number,
  ): readonly ServerEventEnvelope<MatchProtocolEvent>[] {
    if (version < 0) {
      return [...this.events];
    }
    return this.events.filter((e) => e.stateVersion > version);
  }

  public getAllEvents(): readonly ServerEventEnvelope<MatchProtocolEvent>[] {
    return [...this.events];
  }

  public getLatestVersion(): number {
    if (this.events.length === 0) return 0;
    return this.events[this.events.length - 1]!.stateVersion;
  }

  public size(): number {
    return this.events.length;
  }

  public clear(): void {
    this.events.length = 0;
  }
}
