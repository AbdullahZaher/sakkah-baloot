import type { MatchState } from "@sakkah-baloot/game-engine";
import type {
  MatchProtocolEvent,
  ServerEventEnvelope,
} from "@sakkah-baloot/game-protocol";
import type { MatchPersistence } from "./types.js";

export class InMemoryMatchPersistence implements MatchPersistence {
  private readonly snapshots: Map<
    string,
    { stateVersion: number; state: MatchState }
  > = new Map();
  private readonly events: Map<
    string,
    ServerEventEnvelope<MatchProtocolEvent>[]
  > = new Map();

  public async saveSnapshot(
    matchId: string,
    stateVersion: number,
    state: MatchState,
  ): Promise<void> {
    this.snapshots.set(matchId, {
      stateVersion,
      state: JSON.parse(JSON.stringify(state)),
    });
  }

  public async appendEvents(
    matchId: string,
    newEvents: readonly ServerEventEnvelope<MatchProtocolEvent>[],
  ): Promise<void> {
    const existing = this.events.get(matchId) ?? [];
    this.events.set(matchId, [
      ...existing,
      ...JSON.parse(JSON.stringify(newEvents)),
    ]);
  }

  public async loadSnapshot(matchId: string): Promise<MatchState | null> {
    const entry = this.snapshots.get(matchId);
    if (!entry) return null;
    return JSON.parse(JSON.stringify(entry.state));
  }

  public async loadEventsAfter(
    matchId: string,
    stateVersion: number,
  ): Promise<readonly ServerEventEnvelope<MatchProtocolEvent>[]> {
    const list = this.events.get(matchId) ?? [];
    return list
      .filter((e) => e.stateVersion > stateVersion)
      .map((e) => JSON.parse(JSON.stringify(e)));
  }

  public clear(matchId?: string): void {
    if (matchId) {
      this.snapshots.delete(matchId);
      this.events.delete(matchId);
    } else {
      this.snapshots.clear();
      this.events.clear();
    }
  }
}
