// /framework/core/src/command/ledger-fetch.ts

/**
 * A native, completely lightweight fetch layer bypassing legacy dependency wrappers.
 * Safely delivers command payloads strictly adhering to the Canton JSON API v2 protocol.
 */
export class CantonJsonApiClient {
	// Root address of the targeted Canton Ledger API node.
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	}

	/**
	 * Takes an active Daml Template ID and its generated encoded payload format,
	 * pushing this CreateCommand to the Canton HTTP integration node.
	 *
	 * @param token An active, externally authenticated JWT or OAuth identity token
	 * @param templateId The universally unique ledger template identifier
	 * @param encodedPayload Verified and Daml-LF encoded payload representing template parameters
	 */
	public async create(
		token: string | undefined,
		templateId: string,
		encodedPayload: unknown,
	): Promise<{ contractId: string; payload: unknown }> {
		const result = (await this.submitCommand(token, "/v2/command/submit", {
			commands: [
				{
					CreateCommand: {
						templateId: templateId,
						createArguments: encodedPayload,
					},
				},
			],
		})) as { events?: Array<{ created?: { contractId?: string; payload?: unknown } }> };

		// The Ledger usually responds by emitting multiple associated events.
		// Returns solely the relevant originating payload created during submission.
		const createdEvent = result?.events?.[0]?.created;

		if (!createdEvent?.contractId) {
			throw new Error("Ledger API returned a success response but contractId was missing.");
		}

		return {
			contractId: createdEvent.contractId,
			payload: createdEvent.payload || {},
		};
	}

	/**
	 * Exercises a choice on an active ledger contract.
	 *
	 * @param token Authentication token.
	 * @param templateId Template identifier of the contract.
	 * @param contractId Ledger assigned unique ID of the contract.
	 * @param choice Name of the choice to exercise.
	 * @param choiceArgument Optional arguments for the choice.
	 */
	public async exercise(
		token: string | undefined,
		templateId: string,
		contractId: string,
		choice: string,
		choiceArgument: unknown = {},
	): Promise<unknown> {
		const result = (await this.submitCommand(token, "/v2/command/submit", {
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
		return exercisedEvent?.exerciseResult || {};
	}

	/**
	 * General purpose execution layer bridging node-to-ledger JSON communications.
	 */
	private async submitCommand(
		token: string | undefined,
		endpoint: string,
		body: unknown,
	): Promise<unknown> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		// Safely appends Bearer schema should an authentication token be supplied.
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
