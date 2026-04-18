import type { ConstructNexusApi } from "@nexus-framework/core/server";

export type LedgerContext<T extends Record<string, unknown>> = {
  ledger: ConstructNexusApi<T>;
};

export interface NexusOrpcContext<TLedger> {
  req: Request;
  ledger: TLedger;
}

export type HandlerContext<TLedger, TInput> = {
  input: TInput;
  ledger: TLedger;
  context: NexusOrpcContext<TLedger>;
};
