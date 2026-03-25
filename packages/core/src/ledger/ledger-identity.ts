import type { CantonClient } from "../client/canton-client.ts";
import type { LedgerEnd, SynchronizerInfo } from "../types/index.ts";

// ─── LedgerIdentity ───────────────────────────────────────────────────────────

export class LedgerIdentity {
  constructor(private readonly client: CantonClient) {}

  /** Get the current ledger end offset. */
  async getLedgerEnd(): Promise<LedgerEnd> {
    return this.client.getLedgerEnd();
  }

  /** List all synchronizers this participant is connected to. */
  async getConnectedSynchronizers(): Promise<SynchronizerInfo[]> {
    return this.client.getConnectedSynchronizers();
  }

  /**
   * Check if the participant is connected to at least one synchronizer.
   * Useful for health checks.
   */
  async isConnected(): Promise<boolean> {
    const synchronizers = await this.getConnectedSynchronizers();
    return synchronizers.some((s) => s.connected);
  }

  /**
   * Get updates (transactions) from the ledger from a given offset.
   * Returns raw updates and the next offset for pagination.
   */
  async getUpdates(
    beginOffset?: string,
    options?: { endOffset?: string; pageSize?: number },
  ): Promise<{ updates: unknown[]; nextOffset?: string }> {
    return this.client.getUpdates({
      beginOffset,
      endOffset: options?.endOffset,
      pageSize: options?.pageSize,
    });
  }
}
