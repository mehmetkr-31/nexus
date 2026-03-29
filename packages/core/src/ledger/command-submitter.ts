import type { CantonClient } from "../client/canton-client.ts";
import type {
	Command,
	CreateCommand,
	ExerciseCommand,
	ExerciseResult,
	SubmitResult,
	TemplateDescriptor,
	TemplateId,
	TransactionResult,
} from "../types/index.ts";
import type { PackageResolver } from "./package-resolver.ts";

// ─── CommandSubmitter ─────────────────────────────────────────────────────────

export class CommandSubmitter {
	constructor(
		private readonly client: CantonClient,
		private readonly packages?: PackageResolver,
	) {}

	private async resolve(t: string | TemplateId | TemplateDescriptor): Promise<string | TemplateId> {
		if (this.packages && typeof t === "object" && "packageName" in t) {
			return this.packages.resolveTemplateId(t);
		}
		return t as string | TemplateId;
	}

	private async resolveCommand(cmd: Command): Promise<Command> {
		const resolvedTId = await this.resolve(cmd.templateId);
		return { ...cmd, templateId: resolvedTId } as Command;
	}

	/**
	 * Create a new Daml contract on the ledger.
	 */
	async createContract<T extends Record<string, unknown>>(
		templateId: string | TemplateId | TemplateDescriptor,
		createArguments: T,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<SubmitResult> {
		const resolvedTId = await this.resolve(templateId);
		const command: CreateCommand<T> = {
			type: "create",
			templateId: resolvedTId,
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
	async exerciseChoice<TArg extends Record<string, unknown>>(
		templateId: string | TemplateId | TemplateDescriptor,
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
		const resolvedTId = await this.resolve(templateId);
		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId: resolvedTId,
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
	async exerciseAndGetResult<TArg extends Record<string, unknown>, TResult = unknown>(
		templateId: string | TemplateId | TemplateDescriptor,
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
		const resolvedTId = await this.resolve(templateId);
		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId: resolvedTId,
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
		const resolvedCommands = await Promise.all(commands.map((cmd) => this.resolveCommand(cmd)));
		return this.client.submitAndWait({
			commands: resolvedCommands,
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});
	}
}
