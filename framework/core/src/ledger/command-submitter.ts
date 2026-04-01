import type { CantonClient } from "../client/canton-client.ts";
import type {
	Command,
	CreateCommand,
	DamlChoice,
	DamlTemplate,
	ExerciseCommand,
	ExerciseResult,
	NexusTemplateIdentifier,
	SubmitResult,
	TemplateDescriptor,
	TemplateId,
	TransactionResult,
} from "../types/index.ts";
import type { PackageResolver } from "./package-resolver.ts";

interface BaseTemplate {
	templateId: string;
	templateIdWithPackageId: string;
}

// ─── CommandSubmitter ─────────────────────────────────────────────────────────

export class CommandSubmitter {
	constructor(
		private readonly client: CantonClient,
		private readonly packages?: PackageResolver,
	) {}

	private async resolve(t: NexusTemplateIdentifier): Promise<string | TemplateId> {
		if (typeof t === "object" && "templateId" in t && "templateIdWithPackageId" in t) {
			return (t as BaseTemplate).templateIdWithPackageId;
		}
		if (this.packages && (typeof t === "string" || (typeof t === "object" && "packageName" in t))) {
			return this.packages.resolveTemplateId(t as string | TemplateDescriptor);
		}
		return t as string | TemplateId;
	}

	private async resolveCommand(cmd: Command): Promise<Command> {
		const resolvedTId = await this.resolve(cmd.templateId as NexusTemplateIdentifier);
		return { ...cmd, templateId: resolvedTId } as Command;
	}

	/**
	 * Create a new Daml contract on the ledger using type inference.
	 */
	async create<T>(
		template: DamlTemplate<T, unknown, string>,
		payload: T,
		actAs: string[],
		options?: { readAs?: string[]; commandId?: string; workflowId?: string },
	): Promise<SubmitResult> {
		return this.createContract<T>(template.templateId, payload, actAs, options);
	}

	/**
	 * Create a new Daml contract on the ledger.
	 */
	async createContract<T>(
		templateId: NexusTemplateIdentifier,
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
			commands: [command as CreateCommand<unknown>],
			actAs,
			readAs: options?.readAs,
			commandId: options?.commandId,
			workflowId: options?.workflowId,
		});
	}

	/**
	 * Exercise a choice on an existing Daml contract using type inference.
	 */
	async exercise<T, Arg, Res>(
		choice: DamlChoice<T, Arg, Res, unknown>,
		contractId: string,
		argument: Arg,
		actAs: string[],
		options?: { readAs?: string[]; commandId?: string; workflowId?: string },
	): Promise<SubmitResult> {
		return this.exerciseChoice<Arg>(
			choice.template().templateId as NexusTemplateIdentifier,
			contractId,
			choice.choiceName,
			argument,
			actAs,
			options,
		);
	}

	/**
	 * Exercise a choice on an existing Daml contract.
	 */
	async exerciseChoice<TArg>(
		templateId: NexusTemplateIdentifier,
		contractId: string,
		choice: string | DamlChoice<unknown, TArg, unknown, unknown>,
		choiceArgument: TArg,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<SubmitResult> {
		const resolvedTId = await this.resolve(templateId);
		const choiceName = typeof choice === "string" ? choice : choice.choiceName;

		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId: resolvedTId,
			contractId,
			choice: choiceName,
			choiceArgument,
		};

		return this.client.submitAndWait({
			commands: [command as ExerciseCommand<unknown>],
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
	async exerciseAndGetResult<TArg, TResult = unknown>(
		templateId: NexusTemplateIdentifier,
		contractId: string,
		choice: string | DamlChoice<unknown, TArg, TResult, unknown>,
		choiceArgument: TArg,
		actAs: string[],
		options?: {
			readAs?: string[];
			commandId?: string;
			workflowId?: string;
		},
	): Promise<ExerciseResult<TResult>> {
		const resolvedTId = await this.resolve(templateId);
		const choiceName = typeof choice === "string" ? choice : choice.choiceName;

		const command: ExerciseCommand<TArg> = {
			type: "exercise",
			templateId: resolvedTId,
			contractId,
			choice: choiceName,
			choiceArgument,
		};

		const txResult: TransactionResult = await this.client.submitAndWaitForTransaction({
			commands: [command as ExerciseCommand<unknown>],
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
		commands: Array<CreateCommand<unknown> | ExerciseCommand<unknown>>,
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
