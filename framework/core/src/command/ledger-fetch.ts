// /framework/core/src/command/ledger-fetch.ts

/**
 * @deprecated Use `CantonClient` from `@nexus-framework/core` instead.
 * This class uses incorrect endpoint paths and lacks middleware, retry logic,
 * and Zod validation. It will be removed in a future release.
 *
 * Migration:
 * ```ts
 * // Before
 * const client = new CantonJsonApiClient(baseUrl)
 * await client.create(token, templateId, payload)
 *
 * // After
 * import { createNexus, sandboxAuth } from "@nexus-framework/core"
 * const nexus = await createNexus({ ledgerApiUrl: baseUrl, plugins: [sandboxAuth(...)] })
 * await nexus.ledger.commands.createContract(templateId, payload, actAs)
 * ```
 */
export class CantonJsonApiClient {
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	}

	/**
	 * @deprecated Use `nexus.ledger.commands.createContract()` instead.
	 */
	public async create(
		token: string | undefined,
		templateId: string,
		encodedPayload: unknown,
	): Promise<{ contractId: string; payload: unknown }> {
		const result = (await this.submitCommand(token, "/v2/commands/submit-and-wait", {
			commands: [
				{
					CreateCommand: {
						templateId,
						createArguments: encodedPayload,
					},
				},
			],
		})) as {
			updateId?: string;
			events?: Array<{ created?: { contractId?: string; payload?: unknown } }>;
		};

		const createdEvent = result?.events?.[0]?.created;

		if (!createdEvent?.contractId) {
			throw new Error("Ledger API returned a success response but contractId was missing.");
		}

		return {
			contractId: createdEvent.contractId,
			payload: createdEvent.payload ?? {},
		};
	}

	/**
	 * @deprecated Use `nexus.ledger.commands.exerciseChoice()` instead.
	 */
	public async exercise(
		token: string | undefined,
		templateId: string,
		contractId: string,
		choice: string,
		choiceArgument: unknown = {},
	): Promise<unknown> {
		const result = (await this.submitCommand(token, "/v2/commands/submit-and-wait", {
			commands: [
				{
					ExerciseCommand: {
						templateId,
						contractId,
						choice,
						choiceArgument,
					},
				},
			],
		})) as { events?: Array<{ exercised?: { exerciseResult?: unknown } }> };

		const exercisedEvent = result?.events?.find(
			(e: { exercised?: unknown }) => e.exercised,
		)?.exercised;
		return exercisedEvent?.exerciseResult ?? {};
	}

	private async submitCommand(
		token: string | undefined,
		endpoint: string,
		body: unknown,
	): Promise<unknown> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		try {
			const res = await fetch(`${this.baseUrl}${endpoint}`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(`Canton Ledger Error (${res.status}): ${errText}`);
			}

			return await res.json();
		} catch (e: unknown) {
			throw new Error(`Unable to communicate with the Canton ledger: ${(e as Error).message}`);
		}
	}
}
