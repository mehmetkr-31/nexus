import type { CantonClient } from "../client/canton-client.ts";
import type { CreateCommand, ExerciseCommand, SubmitResult, TemplateId } from "../types/index.ts";

// ─── CommandSubmitter ─────────────────────────────────────────────────────────

export class CommandSubmitter {
	constructor(private readonly client: CantonClient) {}

	/**
	 * Create a new Daml contract on the ledger.
	 */
	async createContract<T extends Record<string, unknown> = Record<string, unknown>>(
		templateId: string | TemplateId,
		createArguments: T,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<SubmitResult> {
		const command: CreateCommand<T> = {
			type: "create",
			templateId,
			createArguments,
		};

		return this.client.submitAndWait({
			commands: [command],
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});
	}

	/**
	 * Exercise a choice on an existing Daml contract.
	 */
	async exerciseChoice<TArg extends Record<string, unknown> = Record<string, unknown>>(
		templateId: string | TemplateId,
		contractId: string,
		choice: string,
		choiceArgument: TArg,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<SubmitResult> {
		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId,
			contractId,
			choice,
			choiceArgument,
		};

		return this.client.submitAndWait({
			commands: [command],
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});
	}

	/**
	 * Submit multiple commands atomically in a single transaction.
	 */
	async submitBatch(
		commands: Array<CreateCommand | ExerciseCommand>,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<SubmitResult> {
		return this.client.submitAndWait({
			commands,
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});
	}
}
