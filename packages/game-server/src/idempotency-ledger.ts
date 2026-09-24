import type { CommandResult } from "./types.js";

export class IdempotencyLedger {
  private readonly ledger: Map<string, CommandResult> = new Map();

  public has(actionId: string): boolean {
    return this.ledger.has(actionId);
  }

  public get(actionId: string): CommandResult | undefined {
    const cached = this.ledger.get(actionId);
    if (!cached) return undefined;
    return {
      ...cached,
      cached: true,
    };
  }

  public record(actionId: string, result: CommandResult): void {
    this.ledger.set(actionId, result);
  }

  public size(): number {
    return this.ledger.size;
  }

  public clear(): void {
    this.ledger.clear();
  }
}
