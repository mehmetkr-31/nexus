// /framework/core/src/server.ts

import { CantonJsonApiClient } from "./command/ledger-fetch.js";
import { KyselyPqsEngine } from "./query/pqs-engine.js";
import type {
	ConstructNexusApi,
	DamlTemplate,
	NexusClientConfig,
	NexusUniversalClient,
	PqsFindOptions,
} from "./types/client.js";

export * from "./command/ledger-fetch.js";
export * from "./query/pqs-engine.js";
export * from "./types/client.js";

/**
 * Creates the Isomorphic Universal Nexus SDK Server Client.
 * This client integrates both the Canton JSON API for Ledger commands
 * and the PQS (Kysely-based) Engine for optimized contract queries.
 *
 * Note: This module performs server-side database connections and must
 * not be executed within browser environments.
 *
 * @param myTypes The generated Daml typings module (daml2js)
 * @param config Client configuration including Ledger and PQS URLs
 * @returns The typed Nexus Universal API exposing the withUser context
 */
export function createNexusServerClient<T extends Record<string, unknown>>(
	myTypes: T,
	config: NexusClientConfig,
): NexusUniversalClient<T> {
	const ledgerClient = new CantonJsonApiClient(config.ledgerUrl);
	const pqsEngine = new KyselyPqsEngine(config.pqsUrl);

	return {
		withUser: (partyId: string, token?: string) => {
			const proxyClient = new Proxy(
				{},
				{
					get(_target, contractKey: string) {
						if (contractKey === "then" || contractKey === "catch") return undefined;

						const damlTemplate = myTypes[contractKey] as DamlTemplate<unknown> | undefined;

						if (!damlTemplate?.templateId) {
							throw new Error(
								`Nexus Client Error: Contract '${contractKey}' was not found across the provided Typegen objects.`,
							);
						}

						return {
							/**
							 * Submits a CreateCommand to the Canton Ledger JSON API.
							 * Payload is verified using strict JSON-Type-Validation and encoded into Daml-LF.
							 */
							create: async (payload: unknown) => {
								const result = damlTemplate.decoder.run(payload) as {
									ok: boolean;
									result?: unknown;
									error?: { message: string };
								};

								if (!result.ok || result.result === undefined) {
									throw new Error(
										`Daml Schema Validation Error (${contractKey}): ${
											result.error?.message ?? "Unknown validation failure"
										}`,
									);
								}

								const encodedArg = damlTemplate.encode(result.result);
								const response = await ledgerClient.create(
									token,
									damlTemplate.templateId,
									encodedArg,
								);

								return response; // Return the { contractId, payload } object
							},

							/**
							 * Queries active contracts rapidly via PostgreSQL PQS.
							 */
							findMany: async (options?: PqsFindOptions<unknown>) => {
								return pqsEngine.findMany(partyId, damlTemplate.templateId, options);
							},

							/**
							 * Queries a single contract rapidly via PostgreSQL PQS.
							 */
							findById: async (contractId: string) => {
								return pqsEngine.findById(partyId, damlTemplate.templateId, contractId);
							},

							/**
							 * Submits an ExerciseCommand to the Canton Ledger JSON API.
							 */
							exercise: async (contractId: string, choiceName: string, choiceArgument: unknown) => {
								return ledgerClient.exercise(
									token,
									damlTemplate.templateId,
									contractId,
									choiceName,
									choiceArgument,
								);
							},

							/**
							 * Archives the contract by exercising the Archive choice.
							 */
							archive: async (contractId: string) => {
								return ledgerClient.exercise(
									token,
									damlTemplate.templateId,
									contractId,
									"Archive",
									{},
								);
							},
						};
					},
				},
			);
			return proxyClient as unknown as ConstructNexusApi<T>;
		},
	};
}
