import { z } from "zod";
import {
	type ActiveContractsResponse,
	type ActiveInterfacesResponse,
	type LedgerEnd,
	NexusLedgerError,
	type SubmitRequest,
	type SubmitResult,
	type SynchronizerInfo,
	type TemplateDescriptor,
	type TemplateId,
	type TransactionResult,
} from "../types/index.ts";
import type { FetchMiddleware, RequestConfig } from "../types/plugin.ts";
import { decodeJwtPayload } from "../utils/jwt.ts";
import { toStableTemplateId } from "../utils/template.ts";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const templateIdSchema = z.object({
	packageId: z.string(),
	moduleName: z.string(),
	entityName: z.string(),
});

/** Parse Canton's "pkgId:Module:Entity" string into a TemplateId object */
function parseTemplateId(raw: string): {
	packageId: string;
	moduleName: string;
	entityName: string;
} {
	const parts = raw.split(":");
	return {
		packageId: parts[0] ?? raw,
		moduleName: parts[1] ?? "",
		entityName: parts[2] ?? "",
	};
}

// Canton JSON API v2 wraps each entry as { contractEntry: { JsActiveContract: { createdEvent: {...} } } }
const cantonCreatedEventSchema = z.object({
	contractId: z.string(),
	templateId: z.string(),
	createArgument: z.record(z.string(), z.unknown()),
	createdAt: z.string(),
	signatories: z.array(z.string()),
	observers: z.array(z.string()),
});

const activeContractSchema = z
	.object({
		contractEntry: z.object({
			JsActiveContract: z.object({
				createdEvent: cantonCreatedEventSchema,
			}),
		}),
	})
	.transform(({ contractEntry }) => {
		const ev = contractEntry.JsActiveContract.createdEvent;
		return {
			contractId: ev.contractId,
			templateId: parseTemplateId(ev.templateId),
			payload: ev.createArgument,
			createdAt: ev.createdAt,
			signatories: ev.signatories,
			observers: ev.observers,
		};
	});

const activeContractsResponseSchema = z
	.array(activeContractSchema)
	.transform((contracts) => ({ contracts }));

const submitResultSchema = z.object({
	updateId: z.string(),
	completionOffset: z.number(),
});

const ledgerEndSchema = z.object({
	offset: z.union([z.string(), z.number()]).transform((v) => String(v)),
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

const _exercisedEventSchema = z.object({
	nodeId: z.number(),
	offset: z.number(),
	contractId: z.string(),
	templateId: templateIdSchema,
	interfaceId: z.string().optional(),
	choice: z.string(),
	choiceArgument: z.unknown(),
	actingParties: z.array(z.string()),
	consuming: z.boolean(),
	witnessParties: z.array(z.string()),
	exerciseResult: z.unknown(),
	childNodeIds: z.array(z.number()),
	packageName: z.string(),
});

const transactionResultSchema = z.object({
	transactionId: z.string(),
	commandId: z.string(),
	offset: z.number(),
	completedAt: z.string(),
	events: z.array(z.unknown()),
});

const activeInterfaceSchema = z.object({
	contractId: z.string(),
	templateId: templateIdSchema,
	payload: z.record(z.string(), z.unknown()),
	interfaceId: z.string(),
	interfaceView: z.record(z.string(), z.unknown()),
	signatories: z.array(z.string()),
	observers: z.array(z.string()),
	createdAt: z.string(),
});

const activeInterfacesResponseSchema = z.union([
	z.array(activeInterfaceSchema).transform((interfaces) => ({ interfaces })),
	z
		.object({
			interfaces: z.array(activeInterfaceSchema).optional(),
			activeInterfaces: z.array(activeInterfaceSchema).optional(),
			nextPageToken: z.string().optional(),
		})
		.transform((obj) => ({
			interfaces: obj.interfaces ?? obj.activeInterfaces ?? [],
			nextPageToken: obj.nextPageToken,
		})),
]);

// ─── CantonClient ─────────────────────────────────────────────────────────────

export interface CantonClientOptions {
	baseUrl: string;
	/**
	 * Path prefix for the Canton JSON Ledger API.
	 * Default: "/v2"
	 */
	apiPathPrefix?: string;
	getToken: () => Promise<string>;
	timeoutMs?: number;
	middlewares?: FetchMiddleware[];
}

export class CantonClient {
	public readonly baseUrl: string;
	public readonly getToken: () => Promise<string>;
	private readonly timeoutMs: number;
	private readonly middlewares: FetchMiddleware[];
	private readonly apiBase: string;

	constructor(options: CantonClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.getToken = options.getToken;
		this.timeoutMs = options.timeoutMs ?? 30_000;
		this.middlewares = options.middlewares ?? [];
		this.apiBase = options.apiPathPrefix ?? "/v2";
	}

	// ─── Core fetch helper ─────────────────────────────────────────────────────
	/**
	 * @internal
	 */
	public async request<T>(
		method: string,
		path: string,
		body?: unknown,
		schema?: z.ZodType<T>,
	): Promise<T> {
		const token = await this.getToken();
		const url = `${this.baseUrl}${path}`;

		// Build initial request config and run onRequest middlewares
		let config: RequestConfig = {
			method,
			url,
			path,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body,
		};

		for (const mw of this.middlewares) {
			if (mw.onRequest) {
				config = await mw.onRequest(config);
			}
		}

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);

		let response: Response;
		try {
			response = await fetch(config.url, {
				method: config.method,
				headers: config.headers,
				body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
				signal: controller.signal,
			});
		} catch (err) {
			const error = new NexusLedgerError(
				`Network error calling ${method} ${path}: ${String(err)}`,
				undefined,
				err,
			);
			for (const mw of this.middlewares) {
				if (mw.onError) {
					await mw.onError(error, config);
				}
			}
			throw error;
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
			const d = details as Record<string, unknown>;
			const message =
				(typeof details === "object" &&
					details !== null &&
					(typeof d.message === "string"
						? d.message
						: typeof d.cause === "string"
							? d.cause
							: null)) ||
				`Canton API error: ${response.status} ${response.statusText}`;
			const error = new NexusLedgerError(String(message), response.status, details);
			for (const mw of this.middlewares) {
				if (mw.onError) {
					await mw.onError(error, config);
				}
			}
			throw error;
		}

		// Run onResponse middlewares
		for (const mw of this.middlewares) {
			if (mw.onResponse) {
				await mw.onResponse(response, config);
			}
		}

		// Check if response is JSON before parsing
		const contentType = response.headers.get("Content-Type");
		if (!contentType?.includes("application/json")) {
			throw new NexusLedgerError(
				`Expected JSON response but received ${contentType ?? "unknown content"}. ` +
					`Canton API at ${path} may be returning binary data (e.g. .dalf).`,
				response.status,
			);
		}

		let json = await response.json();

		// Run onAfterResponse middlewares — allows data transformation
		for (const mw of this.middlewares) {
			if (mw.onAfterResponse) {
				json = await mw.onAfterResponse(json, config);
			}
		}

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
		templateId: string | TemplateId,
		options?: {
			filter?: Record<string, unknown>;
			parties?: string[];
			pageToken?: string;
			pageSize?: number;
		},
	): Promise<ActiveContractsResponse<T>> {
		const filtersByParty =
			options?.parties?.reduce(
				(acc, party) => {
					acc[party] = {};
					return acc;
				},
				{} as Record<string, unknown>,
			) ?? {};

		// Fetch current ledger end to get all contracts up to now
		const ledgerEnd = await this.getLedgerEnd();

		const body: Record<string, unknown> = {
			filter: {
				filtersByParty,
				alsoFilterByTemplateId: toStableTemplateId(templateId),
				...options?.filter,
			},
			activeAtOffset: String(ledgerEnd.offset),
		};

		if (options?.parties?.length) {
			body.parties = options.parties;
		}
		if (options?.pageToken) {
			body.pageToken = options.pageToken;
		}
		if (options?.pageSize) {
			body.pageSize = options.pageSize;
		}

		return this.request<ActiveContractsResponse<T>>(
			"POST",
			`${this.apiBase}/state/active-contracts`,
			body,
			activeContractsResponseSchema as z.ZodType<ActiveContractsResponse<T>>,
		);
	}

	// ─── Command Submission ────────────────────────────────────────────────────

	/** Extract the user ID (sub claim) from the current token for use as userId in commands. */
	private async getUserId(): Promise<string | undefined> {
		try {
			const token = await this.getToken();
			return decodeJwtPayload(token).sub;
		} catch {
			return undefined;
		}
	}

	private buildCommandBody(request: SubmitRequest, userId: string | undefined) {
		return {
			commands: request.commands.map((cmd) => {
				if (cmd.type === "create") {
					return {
						CreateCommand: {
							templateId: toStableTemplateId(cmd.templateId),
							createArguments: cmd.createArguments,
						},
					};
				}
				return {
					ExerciseCommand: {
						templateId: toStableTemplateId(cmd.templateId),
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
			...(userId ? { userId } : {}),
		};
	}

	async submitAndWait(request: SubmitRequest): Promise<SubmitResult> {
		const userId = await this.getUserId();
		const body = this.buildCommandBody(request, userId);

		return this.request<SubmitResult>(
			"POST",
			`${this.apiBase}/commands/submit-and-wait`,
			body,
			submitResultSchema,
		);
	}

	/**
	 * Submit commands and wait for the full transaction result, including
	 * exercised events with their Daml return values.
	 */
	async submitAndWaitForTransaction(request: SubmitRequest): Promise<TransactionResult> {
		const userId = await this.getUserId();
		const body = this.buildCommandBody(request, userId);

		return this.request<TransactionResult>(
			"POST",
			`${this.apiBase}/commands/submit-and-wait-for-transaction`,
			body,
			transactionResultSchema as z.ZodType<TransactionResult>,
		);
	}

	// ─── Interface Queries ─────────────────────────────────────────────────────

	/**
	 * Query active contracts through a Daml interface.
	 * Returns contracts with their decoded interface views.
	 */
	async queryByInterface<TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		interfaceId: string | TemplateId,
		options?: {
			parties?: string[];
			pageToken?: string;
			pageSize?: number;
			includeCreateArguments?: boolean;
		},
	): Promise<ActiveInterfacesResponse<TView, TPayload>> {
		const filtersByParty =
			options?.parties?.reduce(
				(acc, party) => {
					acc[party] = {};
					return acc;
				},
				{} as Record<string, unknown>,
			) ?? {};

		const finalInterfaceId = toStableTemplateId(interfaceId);

		const body: Record<string, unknown> = {
			filter: {
				filtersByParty,
				interfaceFilters: [
					{
						interfaceId: finalInterfaceId,
						includeInterfaceView: true,
						includeCreateArguments: options?.includeCreateArguments ?? false,
					},
				],
			},
			activeAtOffset: "0",
		};

		if (options?.parties?.length) {
			body.parties = options.parties;
		}
		if (options?.pageToken) {
			body.pageToken = options.pageToken;
		}
		if (options?.pageSize) {
			body.pageSize = options.pageSize;
		}

		return this.request<ActiveInterfacesResponse<TView, TPayload>>(
			"POST",
			`${this.apiBase}/state/active-contracts`,
			body,
			activeInterfacesResponseSchema as z.ZodType<ActiveInterfacesResponse<TView, TPayload>>,
		);
	}

	// ─── WebSocket Streaming ───────────────────────────────────────────────────

	/**
	 * Open a WebSocket stream for active contract updates.
	 * Uses the `jwt.token.<TOKEN>` subprotocol for auth (Canton standard).
	 *
	 * @returns A `StreamHandle` with `close()`, `updateToken()`, and `connected` getter.
	 */
	async streamActiveContracts<T = Record<string, unknown>>(
		templateId: string | TemplateId | TemplateDescriptor,
		handlers: {
			onCreate?: (contract: import("../types/index.ts").ActiveContract<T>) => void;
			onArchive?: (contractId: string, templateId: import("../types/index.ts").TemplateId) => void;
			onLive?: () => void;
			onError?: (error: Error) => void;
			onClose?: () => void;
			onConnectedChange?: (connected: boolean) => void;
		},
		options?: { parties?: string[] },
	): Promise<import("../types/index.ts").StreamHandle> {
		const token = await this.getToken();
		const stableId = toStableTemplateId(templateId);
		const wsUrl = `${this.baseUrl.replace(/^http/, "ws")}${this.apiBase}/state/active-contracts/stream`;

		let ws = new WebSocket(wsUrl, [`jwt.token.${token}`, "daml.ws.auth"]);
		let _connected = false;

		const subscribe = (socket: WebSocket) => {
			socket.onopen = () => {
				_connected = true;
				handlers.onConnectedChange?.(true);
				socket.send(
					JSON.stringify({
						templateIds: [stableId],
						parties: options?.parties ?? [],
					}),
				);
			};

			socket.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data as string) as Record<string, unknown>;
					if ("created" in msg) {
						handlers.onCreate?.(msg.created as import("../types/index.ts").ActiveContract<T>);
					} else if ("archived" in msg) {
						const archived = msg.archived as {
							contractId: string;
							templateId: import("../types/index.ts").TemplateId;
						};
						handlers.onArchive?.(archived.contractId, archived.templateId);
					} else if ("live_marker" in msg || msg.type === "live") {
						handlers.onLive?.();
					}
				} catch (err) {
					handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
				}
			};

			socket.onerror = () => {
				handlers.onError?.(new Error("WebSocket error"));
			};

			socket.onclose = () => {
				_connected = false;
				handlers.onConnectedChange?.(false);
				handlers.onClose?.();
			};
		};

		subscribe(ws);

		const handle: import("../types/index.ts").StreamHandle = {
			close: () => ws.close(),
			/**
			 * Re-connect the stream with a new bearer token.
			 * Closes the current WebSocket and opens a new one — transparent to the caller.
			 */
			updateToken: (newToken: string) => {
				ws.close();
				const newUrl = `${this.baseUrl.replace(/^http/, "ws")}${this.apiBase}/state/active-contracts/stream`;
				ws = new WebSocket(newUrl, [`jwt.token.${newToken}`, "daml.ws.auth"]);
				subscribe(ws);
			},
			get connected() {
				return _connected;
			},
		};

		return handle;
	}

	// ─── Packages ──────────────────────────────────────────────────────────────

	/**
	 * List all packages uploaded to the participant node.
	 *
	 * @returns Array of package identifiers (hex strings)
	 */
	async listPackages(): Promise<string[]> {
		const response = await this.request<{ packageIds: string[] }>(
			"GET",
			`${this.apiBase}/packages`,
		);
		return response.packageIds ?? [];
	}

	/**
	 * Download the raw DALF bytes for a specific package.
	 * The binary contains the package name encoded in protobuf format.
	 *
	 * @param packageId Hex identifier of the package
	 */
	async getPackageBytes(packageId: string): Promise<Uint8Array> {
		const token = await this.getToken();
		const url = `${this.baseUrl}${this.apiBase}/packages/${packageId}`;
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(this.timeoutMs),
		});
		if (!response.ok) {
			throw new NexusLedgerError(`Package not found: ${packageId}`, response.status);
		}
		return new Uint8Array(await response.arrayBuffer());
	}

	// ─── Ledger State ──────────────────────────────────────────────────────────

	async getLedgerEnd(): Promise<LedgerEnd> {
		return this.request<LedgerEnd>(
			"GET",
			`${this.apiBase}/state/ledger-end`,
			undefined,
			ledgerEndSchema,
		);
	}

	async getConnectedSynchronizers(): Promise<SynchronizerInfo[]> {
		const response = await this.request<{ synchronizers: unknown[] }>(
			"GET",
			`${this.apiBase}/state/connected-synchronizers`,
		);
		return z.array(synchronizerInfoSchema).parse(response.synchronizers ?? []);
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
		return this.request("GET", `${this.apiBase}/updates${qs}`);
	}

	/**
	 * Wait for a transaction to be committed to the ledger.
	 * Polls the `/v2/updates` endpoint until the transactionId appears.
	 *
	 * @param transactionId ID from a successful command submission
	 * @param options Polling configuration (timeout, interval, signal)
	 */
	async waitForTransaction(
		transactionId: string,
		options?: { timeoutMs?: number; intervalMs?: number; signal?: AbortSignal },
	): Promise<TransactionResult> {
		const timeout = options?.timeoutMs ?? 30_000;
		const interval = options?.intervalMs ?? 1_000;
		const start = Date.now();

		// Start from the very end of the ledger to avoid scanning old history
		const ledgerEnd = await this.getLedgerEnd();
		let currentOffset = ledgerEnd.offset;

		while (Date.now() - start < timeout) {
			if (options?.signal?.aborted) {
				throw new Error("Transaction wait aborted by signal");
			}

			const { updates, nextOffset } = await this.getUpdates({
				beginOffset: currentOffset,
				pageSize: 50,
			});

			for (const update of updates) {
				const tx = update as TransactionResult;
				if (
					tx &&
					typeof tx === "object" &&
					"transactionId" in tx &&
					tx.transactionId === transactionId
				) {
					return tx; // Found with full result!
				}
			}

			if (nextOffset) {
				currentOffset = nextOffset;
			}

			await new Promise((resolve, reject) => {
				const timer = setTimeout(resolve, interval);
				options?.signal?.addEventListener("abort", () => {
					clearTimeout(timer);
					reject(new Error("Transaction wait aborted by signal during sleep"));
				});
			});
		}

		throw new Error(`Transaction ${transactionId} did not appear on ledger within ${timeout}ms`);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCommandId(): string {
	return `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
