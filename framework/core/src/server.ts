// /framework/core/src/server.ts
// Server-only exports — DO NOT import in browser bundles.

import type { FetchMiddleware, NexusPlugin } from "./types/plugin.ts";
import type { SessionManager } from "./auth/session-manager.ts";
import type {
	CommandQueryOperations,
	ConstructNexusApi,
	DamlTemplate,
	NexusServerConfig,
	NexusUniversalClient,
	PqsFindOptions,
} from "./types/client.ts";
import { CantonClient } from "./client/canton-client.ts";
import { KyselyPqsEngine } from "./query/pqs-engine.ts";
import type { NexusClient } from "./types/index.ts";
import type { InferNexusClientPlugins } from "./types/plugin.ts";

export * from "./command/ledger-fetch.ts";
export * from "./plugins/canton-ledger.ts";
export * from "./plugins/pqs-database.ts";
export * from "./plugins/session-auth.ts";
export * from "./query/pqs-engine.ts";
export * from "./types/client.ts";

// ─── createNexusServerClient (low-level plugin API) ──────────────────────────

/**
 * Low-level server client factory using the plugin architecture.
 * For most use cases prefer `createNexusServer()`.
 */
export function createNexusServerClient<T extends Record<string, unknown>>(
	config: NexusServerConfig<T>,
): NexusUniversalClient<T> {
	const plugins = config.plugins ?? [];
	for (const plugin of plugins) {
		if (plugin.onInit) plugin.onInit(config);
	}

	return {
		withUser: (partyId: string, token?: string) => {
			const proxy = new Proxy(
				{},
				{
					get(_target, contractKey: string) {
						if (contractKey === "then" || contractKey === "catch") return undefined;

						const damlTemplate = config.types[contractKey] as DamlTemplate<unknown> | undefined;
						if (!damlTemplate?.templateId) {
							throw new Error(
								`Nexus: contract "${contractKey}" not found. ` +
									`Available: ${Object.keys(config.types).join(", ")}`,
							);
						}

						let ops: CommandQueryOperations<unknown> = {
							create: async () => {
								throw new Error("No cantonLedgerPlugin configured");
							},
							findMany: async () => {
								throw new Error("No pqsDatabasePlugin configured");
							},
							findById: async () => {
								throw new Error("No pqsDatabasePlugin configured");
							},
							exercise: async () => {
								throw new Error("No cantonLedgerPlugin configured");
							},
							archive: async () => {
								throw new Error("No cantonLedgerPlugin configured");
							},
						};

						for (const plugin of plugins) {
							if (plugin.extendOperations) {
								ops = plugin.extendOperations(ops, {
									partyId,
									token,
									templateId: damlTemplate.templateId,
									template: damlTemplate,
								});
							}
						}

						return ops;
					},
				},
			);
			return proxy as unknown as ConstructNexusApi<T>;
		},
	};
}

// ─── createNexusContextExtractor ─────────────────────────────────────────────

/**
 * Wraps a `NexusUniversalClient` with session-cookie authentication.
 * Call the returned function in Server Actions, Hono routes, etc.
 *
 * @example
 * ```ts
 * export const requireNexusContext = createNexusContextExtractor(backendSDK, sessionManager)
 * const ctx = await requireNexusContext(req)
 * const ious = await ctx.Iou.findMany()
 * ```
 */
export function createNexusContextExtractor<T extends Record<string, unknown>>(
	serverClient: NexusUniversalClient<T>,
	sessionManager: SessionManager,
): (req: Request) => Promise<ConstructNexusApi<T>> {
	return async (req: Request): Promise<ConstructNexusApi<T>> => {
		const session = await sessionManager.requireSession(req);
		return serverClient.withUser(session.partyId, session.token);
	};
}

// ─── createNexusServer (unified factory) ─────────────────────────────────────

export interface NexusServerOptions<
	// biome-ignore lint/suspicious/noExplicitAny: Daml codegen encode() is contravariant; any is needed to accept Template<Iou> as DamlTemplate
	TTypes extends Record<string, DamlTemplate<any>>,
	TPlugins extends NexusPlugin<Record<string, unknown>>[],
> {
	/** Canton JSON Ledger API URL. */
	ledgerApiUrl: string;
	/**
	 * Optional PQS Postgres connection string.
	 * When provided, `forParty().findMany()` and `forParty().findById()` use SQL.
	 * Without it, `findById` falls back to Canton HTTP and `findMany` throws.
	 */
	pqsUrl?: string;
	/**
	 * Auth plugin: `sandboxAuth()`, `jwtAuth()`, or `oidcAuth()`.
	 * Used for the `client` NexusClient and as fallback token for `forParty()`.
	 */
	auth: NexusPlugin<Record<string, unknown>>;
	/**
	 * Daml template type map. Keys become the accessor names on `forParty()`.
	 * @example { Iou: Iou.Iou }
	 */
	types: TTypes;
	/**
	 * Session manager for cookie-based auth in `forRequest()`.
	 * Required only if you call `nexus.forRequest(req)`.
	 */
	sessionManager?: SessionManager;
	/** Extra plugins (e.g. `fetchMiddlewarePlugin`, `packageDiscoveryPlugin`). */
	plugins?: TPlugins;
	timeoutMs?: number;
	apiPathPrefix?: string;
}

export interface NexusServer<
	// biome-ignore lint/suspicious/noExplicitAny: Daml codegen encode() is contravariant; any is needed to accept Template<Iou> as DamlTemplate
	TTypes extends Record<string, DamlTemplate<any>>,
	TPlugins extends NexusPlugin<Record<string, unknown>>[],
> {
	/**
	 * Raw `NexusClient` — use for Canton HTTP queries, TanStack prefetch, etc.
	 *
	 * @example
	 * await queryClient.prefetchQuery(
	 *   nexus.client.query.contracts({ templateId: Iou.Iou, parties: [partyId] })
	 * )
	 */
	client: NexusClient & InferNexusClientPlugins<TPlugins>;

	/**
	 * Returns a typed ledger context for a specific party.
	 * PQS reads (if configured) + Canton HTTP writes.
	 *
	 * @example
	 * const ctx = nexus.forParty(partyId, token)
	 * const ious = await ctx.Iou.findMany({ where: { owner: partyId } })
	 * await ctx.Iou.create({ owner: partyId, amount: "100", currency: "USD" })
	 */
	forParty: (partyId: string, token?: string) => ConstructNexusApi<TTypes>;

	/**
	 * Extracts session from a web Request (cookie) and returns a context.
	 * Requires `sessionManager` to be set in options.
	 *
	 * @example
	 * const ctx = await nexus.forRequest(req)
	 * const ious = await ctx.Iou.findMany()
	 */
	forRequest: (req: Request) => Promise<ConstructNexusApi<TTypes>>;
}

/**
 * Creates a unified Nexus server instance combining:
 * - Canton HTTP client (`nexus.client`) for TanStack Query prefetch
 * - PQS SQL reads (`nexus.forParty().findMany()`)
 * - Canton HTTP writes (`nexus.forParty().create()`, `.exercise()`, `.archive()`)
 * - Session-cookie auth (`nexus.forRequest(req)`)
 *
 * @example
 * ```ts
 * // lib/nexus.ts
 * export const nexus = await createNexusServer({
 *   ledgerApiUrl: process.env.CANTON_API_URL!,
 *   pqsUrl: process.env.PQS_URL,
 *   auth: sandboxAuth({ userId: "alice", secret: "secret" }),
 *   types: { Iou: Iou.Iou },
 *   sessionManager: new SessionManager({ encryptionKey: process.env.SESSION_KEY }),
 * })
 *
 * // Server Component
 * const partyId = await nexus.client.auth.partyId.resolvePartyId("alice")
 * await queryClient.prefetchQuery(nexus.client.query.contracts({ templateId: Iou.Iou, parties: [partyId] }))
 *
 * // Server Action
 * const ctx = await nexus.forRequest(req)
 * await ctx.Iou.create({ owner: partyId, amount: "100", currency: "USD" })
 *
 * // Hono / TanStack Start
 * const ctx = nexus.forParty(partyId, token)
 * const ious = await ctx.Iou.findMany()
 * ```
 */
export async function createNexusServer<
	// biome-ignore lint/suspicious/noExplicitAny: Daml codegen encode() is contravariant; any is needed to accept Template<Iou> as DamlTemplate
	TTypes extends Record<string, DamlTemplate<any>>,
	TPlugins extends NexusPlugin<Record<string, unknown>>[],
>(options: NexusServerOptions<TTypes, TPlugins>): Promise<NexusServer<TTypes, TPlugins>> {
	const { createNexus } = await import("./index.ts");

	// Build the NexusClient (Canton HTTP + TanStack query factories)
	const allPlugins = [options.auth, ...(options.plugins ?? [])] as TPlugins;
	const nexusClient = await createNexus({
		ledgerApiUrl: options.ledgerApiUrl,
		apiPathPrefix: options.apiPathPrefix,
		timeoutMs: options.timeoutMs,
		plugins: allPlugins,
	});

	// Optional PQS engine
	const pqsEngine = options.pqsUrl ? new KyselyPqsEngine(options.pqsUrl) : undefined;

	const forParty = (partyId: string, token?: string): ConstructNexusApi<TTypes> => {
		const proxy = new Proxy({} as ConstructNexusApi<TTypes>, {
			get(_target, contractKey: string) {
				if (contractKey === "then" || contractKey === "catch") return undefined;

				const damlTemplate = options.types[contractKey] as DamlTemplate<unknown> | undefined;
				if (!damlTemplate?.templateId) {
					throw new Error(
						`Nexus: "${contractKey}" not found in types. Available: ${Object.keys(options.types).join(", ")}`,
					);
				}

				const templateId = damlTemplate.templateId;
				const actAs = [partyId];

				const resolveToken = async (): Promise<string> => {
					if (token) return token;
					return nexusClient.getToken();
				};

				const getHttp = () =>
					new CantonClient({
						baseUrl: options.ledgerApiUrl,
						timeoutMs: options.timeoutMs,
						getToken: resolveToken,
					});

				const ops: CommandQueryOperations<unknown> = {
					findMany: async (findOptions?: PqsFindOptions<unknown>) => {
						if (!pqsEngine) {
							throw new Error(
								"Nexus: findMany() requires pqsUrl. " +
									"Use nexus.client.ledger.contracts.fetchActiveContracts() for Canton HTTP.",
							);
						}
						const rows = await pqsEngine.findMany(partyId, templateId, findOptions);
						// biome-ignore lint/suspicious/noExplicitAny: payload is opaque at this level
						return rows as any[];
					},

					findById: async (contractId: string) => {
						if (pqsEngine) {
							// biome-ignore lint/suspicious/noExplicitAny: payload is opaque at this level
							return pqsEngine.findById(partyId, templateId, contractId) as Promise<any>;
						}
						const http = getHttp();
						const r = await http.getContractById(contractId, { parties: actAs });
						if (!r) return null;
						// biome-ignore lint/suspicious/noExplicitAny: payload is opaque at this level
						return { contractId: r.contractId, payload: r.payload as any };
					},

					create: async (payload: unknown) => {
						const v = damlTemplate.decoder.run(payload) as {
							ok: boolean;
							result?: unknown;
							error?: { message: string };
						};
						if (!v.ok || v.result === undefined) {
							throw new Error(
								`Daml validation failed (${templateId}): ${v.error?.message ?? "unknown"}`,
							);
						}
						const encoded = damlTemplate.encode(v.result);
						const http = getHttp();
						const res = await http.submitAndWait({
							commands: [{ type: "create", templateId, createArguments: encoded }],
							actAs,
						});
						return { contractId: res.updateId, payload: encoded as Record<string, unknown> };
					},

					exercise: async (contractId: string, choice: string, choiceArgument: unknown) => {
						const http = getHttp();
						return http.submitAndWait({
							commands: [{ type: "exercise", templateId, contractId, choice, choiceArgument }],
							actAs,
						});
					},

					archive: async (contractId: string) => {
						const http = getHttp();
						return http.submitAndWait({
							commands: [
								{ type: "exercise", templateId, contractId, choice: "Archive", choiceArgument: {} },
							],
							actAs,
						});
					},
				};

				return ops;
			},
		});
		return proxy;
	};

	const forRequest = async (req: Request): Promise<ConstructNexusApi<TTypes>> => {
		if (!options.sessionManager) {
			throw new Error("Nexus: forRequest() requires sessionManager to be configured.");
		}
		const session = await options.sessionManager.requireSession(req);
		return forParty(session.partyId, session.token);
	};

	return {
		client: nexusClient as NexusClient & InferNexusClientPlugins<TPlugins>,
		forParty,
		forRequest,
	};
}
