import type { CantonClient } from "../client/canton-client.ts";
import type {
	CreateCommand,
	ExerciseCommand,
	ExerciseResult,
	SubmitResult,
	TemplateId,
	TransactionResult,
} from "../types/index.ts";

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
	 * Exercise a choice and return the full transaction result including
	 * the Daml choice return value.
	 *
	 * Use this when you need the `exerciseResult` from the choice.
	 */
	async exerciseAndGetResult<
		TArg extends Record<string, unknown> = Record<string, unknown>,
		TResult = unknown,
	>(
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
	): Promise<ExerciseResult<TResult>> {
		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId,
			contractId,
			choice,
			choiceArgument,
		};

		const txResult: TransactionResult = await this.client.submitAndWaitForTransaction({
			commands: [command],
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});

		// Extract the exercised event from the transaction result
		const exercisedEvent = txResult.events.find((e) => e.type === "exercised") as
			| { type: "exercised"; event: { exerciseResult: TResult } }
			| undefined;

		return {
			transactionId: txResult.transactionId,
			commandId: txResult.commandId,
			offset: txResult.offset,
			completedAt: txResult.completedAt,
			result: exercisedEvent?.event.exerciseResult as TResult,
		};
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
