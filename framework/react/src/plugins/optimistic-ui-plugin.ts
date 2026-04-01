import type { ActiveContract, NexusTemplateIdentifier, TemplateId } from "@nexus-framework/core";
import { toStableTemplateId } from "@nexus-framework/core";
import type { NexusClientPlugin } from "./tanstack-query.ts";

export interface OptimisticUpdateConfig<T = unknown> {
	templateId: NexusTemplateIdentifier;
	/**
	 * Function to generate the optimistic update for a choice.
	 * If it returns null, no update is applied for that choice.
	 */
	onChoice?: (
		choice: string,
		argument: unknown,
		contract: ActiveContract<T>,
	) => Partial<ActiveContract<T>> | null;
}

export interface OptimisticUiPluginOptions {
	updates: OptimisticUpdateConfig<unknown>[];
}

/**
 * Plugin that provides declarative optimistic UI logic for Nexus.
 */
export function optimisticUiPlugin(options: OptimisticUiPluginOptions): NexusClientPlugin<{
	optimistic: {
		getUpdate: (
			templateId: string | TemplateId,
			choice: string,
			argument: unknown,
			contract: ActiveContract,
		) => Partial<ActiveContract> | null;
	};
}> {
	return {
		id: "optimistic-ui",

		getActions: () => {
			const registry = new Map<string, OptimisticUpdateConfig<unknown>>();

			for (const update of options.updates) {
				const key = toStableTemplateId(update.templateId);
				registry.set(key, update);
			}

			return {
				optimistic: {
					getUpdate: (
						templateId: string | TemplateId,
						choice: string,
						argument: unknown,
						contract: ActiveContract,
					) => {
						const key = toStableTemplateId(templateId);
						const config = registry.get(key);
						// We cast to any here because the registry stores unknown configs,
						// and we're matching by templateId which guarantees the payload type matches.
						// This is safe because onChoice only returns a Partial of the same contract.
						// biome-ignore lint/suspicious/noExplicitAny: Registry lookup guarantees type safety at runtime
						return (config as any)?.onChoice?.(choice, argument, contract) ?? null;
					},
				},
			};
		},
	};
}
