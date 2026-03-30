import type { ActiveContract, TemplateDescriptor, TemplateId } from "@nexus-framework/core";
import type { NexusClientPlugin } from "./tanstack-query.ts";

export interface OptimisticUpdateConfig<T = Record<string, unknown>> {
	templateId: string | TemplateDescriptor;
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
	updates: OptimisticUpdateConfig[];
}

/**
 * Plugin that provides declarative optimistic UI logic for Nexus.
 *
 * It extends the client with an `optimistic` registry that hooks can use
 * to look up how to update the cache for a given template/choice combination.
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
			const registry = new Map<string, OptimisticUpdateConfig>();

			for (const update of options.updates) {
				const key =
					typeof update.templateId === "string"
						? update.templateId
						: `${update.templateId.packageName}:${update.templateId.moduleName}:${update.templateId.entityName}`;
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
						const key =
							typeof templateId === "string"
								? templateId
								: `${templateId.packageId}:${templateId.moduleName}:${templateId.entityName}`;

						const config = registry.get(key);
						return config?.onChoice?.(choice, argument, contract) ?? null;
					},
				},
			};
		},
	};
}
