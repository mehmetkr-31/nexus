import { z } from "zod";
import {
  NexusLedgerError,
  type ActiveContractsResponse,
  type LedgerEnd,
  type SubmitRequest,
  type SubmitResult,
  type SynchronizerInfo,
} from "../types/index.ts";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const templateIdSchema = z.object({
  packageId: z.string(),
  moduleName: z.string(),
  entityName: z.string(),
});

const activeContractSchema = z.object({
  contractId: z.string(),
  templateId: templateIdSchema,
  payload: z.record(z.unknown()),
  createdAt: z.string(),
  signatories: z.array(z.string()),
  observers: z.array(z.string()),
});

const activeContractsResponseSchema = z.object({
  contracts: z.array(activeContractSchema),
  nextPageToken: z.string().optional(),
});

const submitResultSchema = z.object({
  transactionId: z.string(),
  commandId: z.string(),
  offset: z.string(),
  completedAt: z.string(),
});

const ledgerEndSchema = z.object({
  offset: z.string(),
});

const synchronizerInfoSchema = z.object({
  synchronizerId: z.string(),
  synchronizerAlias: z.string(),
  connected: z.boolean(),
});

const errorResponseSchema = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

// ─── CantonClient ─────────────────────────────────────────────────────────────

export interface CantonClientOptions {
  baseUrl: string;
  getToken: () => Promise<string>;
  timeoutMs?: number;
}

export class CantonClient {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string>;
  private readonly timeoutMs: number;

  constructor(options: CantonClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getToken = options.getToken;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // ─── Core fetch helper ─────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    schema?: z.ZodType<T>,
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      throw new NexusLedgerError(
        `Network error calling ${method} ${path}: ${String(err)}`,
        undefined,
        err,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let details: unknown;
      try {
        const raw = await response.json();
        details = errorResponseSchema.safeParse(raw).data ?? raw;
      } catch {
        details = await response.text().catch(() => undefined);
      }
      const message =
        typeof details === "object" &&
        details !== null &&
        "message" in details &&
        typeof (details as Record<string, unknown>)["message"] === "string"
          ? (details as Record<string, unknown>)["message"]
          : `Canton API error: ${response.status} ${response.statusText}`;
      throw new NexusLedgerError(String(message), response.status, details);
    }

    const json = await response.json();

    if (!schema) {
      return json as T;
    }

    const result = schema.safeParse(json);
    if (!result.success) {
      throw new NexusLedgerError(
        `Response validation failed for ${path}: ${result.error.message}`,
        undefined,
        result.error.issues,
      );
    }
    return result.data;
  }

  // ─── Active Contracts ──────────────────────────────────────────────────────

  async queryContracts<T = Record<string, unknown>>(
    templateId: string,
    options?: {
      filter?: Record<string, unknown>;
      parties?: string[];
      pageToken?: string;
      pageSize?: number;
    },
  ): Promise<ActiveContractsResponse<T>> {
    const body: Record<string, unknown> = {
      filter: {
        filtersByParty: {},
        alsoFilterByTemplateId: templateId,
        ...options?.filter,
      },
    };

    if (options?.parties?.length) {
      body["parties"] = options.parties;
    }
    if (options?.pageToken) {
      body["pageToken"] = options.pageToken;
    }
    if (options?.pageSize) {
      body["pageSize"] = options.pageSize;
    }

    return this.request<ActiveContractsResponse<T>>(
      "POST",
      "/v2/state/active-contracts",
      body,
      activeContractsResponseSchema as z.ZodType<ActiveContractsResponse<T>>,
    );
  }

  // ─── Command Submission ────────────────────────────────────────────────────

  async submitAndWait(request: SubmitRequest): Promise<SubmitResult> {
    const body = {
      commands: request.commands.map((cmd) => {
        if (cmd.type === "create") {
          return {
            CreateCommand: {
              templateId:
                typeof cmd.templateId === "string"
                  ? cmd.templateId
                  : formatTemplateId(cmd.templateId),
              createArguments: cmd.createArguments,
            },
          };
        }
        return {
          ExerciseCommand: {
            templateId:
              typeof cmd.templateId === "string"
                ? cmd.templateId
                : formatTemplateId(cmd.templateId),
            contractId: cmd.contractId,
            choice: cmd.choice,
            choiceArgument: cmd.choiceArgument,
          },
        };
      }),
      actAs: request.actAs,
      readAs: request.readAs ?? [],
      commandId: request.commandId ?? generateCommandId(),
      workflowId: request.workflowId,
    };

    return this.request<SubmitResult>(
      "POST",
      "/v2/commands/submit-and-wait",
      body,
      submitResultSchema,
    );
  }

  // ─── Ledger State ──────────────────────────────────────────────────────────

  async getLedgerEnd(): Promise<LedgerEnd> {
    return this.request<LedgerEnd>(
      "GET",
      "/v2/state/ledger-end",
      undefined,
      ledgerEndSchema,
    );
  }

  async getConnectedSynchronizers(): Promise<SynchronizerInfo[]> {
    const response = await this.request<{ synchronizers: unknown[] }>(
      "GET",
      "/v2/state/connected-synchronizers",
    );
    return z
      .array(synchronizerInfoSchema)
      .parse(response.synchronizers ?? []);
  }

  // ─── Updates / Event Streaming ────────────────────────────────────────────

  async getUpdates(options?: {
    beginOffset?: string;
    endOffset?: string;
    pageSize?: number;
  }): Promise<{ updates: unknown[]; nextOffset?: string }> {
    const params = new URLSearchParams();
    if (options?.beginOffset) params.set("beginOffset", options.beginOffset);
    if (options?.endOffset) params.set("endOffset", options.endOffset);
    if (options?.pageSize) params.set("pageSize", String(options.pageSize));

    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request("GET", `/v2/updates${qs}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTemplateId(t: {
  packageId: string;
  moduleName: string;
  entityName: string;
}): string {
  return `${t.packageId}:${t.moduleName}:${t.entityName}`;
}

function generateCommandId(): string {
  return `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
