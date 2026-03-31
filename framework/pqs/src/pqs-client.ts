import type { ActiveContractRow, PqsContract, PqsQueryOptions } from "./types.ts";

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow<T>(row: ActiveContractRow): PqsContract<T> {
	return {
		contractId: row.contract_id,
		templateId: {
			packageId: row.template_id_package_id,
			moduleName: row.template_id_module_name,
			entityName: row.template_id_entity_name,
		},
		payload: row.create_argument as T,
		signatories: row.signatories,
		observers: row.observers,
		createdAt: row.created_at,
	};
}

// ─── PqsClient ────────────────────────────────────────────────────────────────

/**
 * Client for querying the Canton Participant Query Store (PQS) via Postgres.
 *
 * PQS is a read-only Postgres replica maintained by the Canton participant node.
 * It exposes active contract state as SQL tables for fast, filterable queries.
 *
 * Uses `Bun.SQL` — no extra npm dependency needed.
 *
 * @example
 * ```ts
 * const pqs = new PqsClient(process.env.PQS_DATABASE_URL!);
 *
 * // All multisig wallets where Alice is an owner
 * const { contracts } = await pqs.getActiveContracts<WalletPayload>(
 *   "pkg:MultisigWallet:MultisigWallet",
 *   { parties: ["Alice::abc"] }
 * );
 *
 * // Filter by payload field
 * const { contracts: aliceWallets } = await pqs.getActiveContracts<WalletPayload>(
 *   "pkg:MultisigWallet:MultisigWallet",
 *   { payloadFilter: { custodian: "Alice::abc" } }
 * );
 * ```
 */
export class PqsClient {
	private readonly sql: Bun.SQL;

	/**
	 * @param connectionString Postgres connection URL.
	 *   e.g. `postgres://user:pass@localhost:5432/pqs`
	 */
	constructor(connectionString: string) {
		this.sql = new Bun.SQL(connectionString);
	}

	// ─── getActiveContracts ───────────────────────────────────────────────────

	/**
	 * Fetch active contracts for a Daml template.
	 *
	 * `templateId` must be `"packageId:ModuleName:EntityName"`.
	 */
	async getActiveContracts<T = Record<string, unknown>>(
		templateId: string,
		options: PqsQueryOptions = {},
	): Promise<{ contracts: PqsContract<T>[] }> {
		const { packageId, moduleName, entityName } = parseTemplateId(templateId);
		// ORDER BY direction from validated enum — safe to embed via unsafe()
		const order = this.sql.unsafe(options.order === "asc" ? "ASC" : "DESC");
		const limit = options.limit ?? 100;
		const offset = options.offset ?? 0;

		const parties = options.parties ?? [];
		const hasParies = parties.length > 0;
		const payloadFilter = options.payloadFilter;
		const hasFilter = payloadFilter != null;
		const payloadJson = hasFilter ? JSON.stringify(payloadFilter) : "";

		let rows: ActiveContractRow[];

		if (hasParies && hasFilter) {
			rows = await this.sql<ActiveContractRow[]>`
				SELECT
					contract_id,
					template_id_package_id,
					template_id_module_name,
					template_id_entity_name,
					create_argument,
					signatories,
					observers,
					created_at::text
				FROM active_contracts
				WHERE template_id_package_id = ${packageId}
				  AND template_id_module_name = ${moduleName}
				  AND template_id_entity_name = ${entityName}
				  AND (signatories && ${parties}::text[]
				       OR observers && ${parties}::text[])
				  AND create_argument @> ${payloadJson}::jsonb
				ORDER BY created_at ${order}
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasParies) {
			rows = await this.sql<ActiveContractRow[]>`
				SELECT
					contract_id,
					template_id_package_id,
					template_id_module_name,
					template_id_entity_name,
					create_argument,
					signatories,
					observers,
					created_at::text
				FROM active_contracts
				WHERE template_id_package_id = ${packageId}
				  AND template_id_module_name = ${moduleName}
				  AND template_id_entity_name = ${entityName}
				  AND (signatories && ${parties}::text[]
				       OR observers && ${parties}::text[])
				ORDER BY created_at ${order}
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasFilter) {
			rows = await this.sql<ActiveContractRow[]>`
				SELECT
					contract_id,
					template_id_package_id,
					template_id_module_name,
					template_id_entity_name,
					create_argument,
					signatories,
					observers,
					created_at::text
				FROM active_contracts
				WHERE template_id_package_id = ${packageId}
				  AND template_id_module_name = ${moduleName}
				  AND template_id_entity_name = ${entityName}
				  AND create_argument @> ${payloadJson}::jsonb
				ORDER BY created_at ${order}
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else {
			rows = await this.sql<ActiveContractRow[]>`
				SELECT
					contract_id,
					template_id_package_id,
					template_id_module_name,
					template_id_entity_name,
					create_argument,
					signatories,
					observers,
					created_at::text
				FROM active_contracts
				WHERE template_id_package_id = ${packageId}
				  AND template_id_module_name = ${moduleName}
				  AND template_id_entity_name = ${entityName}
				ORDER BY created_at ${order}
				LIMIT ${limit} OFFSET ${offset}
			`;
		}

		return { contracts: rows.map((r) => mapRow<T>(r)) };
	}

	// ─── getContractById ──────────────────────────────────────────────────────

	/**
	 * Fetch a single active contract by its contract ID.
	 * Returns `undefined` if archived or not found.
	 */
	async getContractById<T = Record<string, unknown>>(
		contractId: string,
	): Promise<PqsContract<T> | undefined> {
		const rows = await this.sql<ActiveContractRow[]>`
			SELECT
				contract_id,
				template_id_package_id,
				template_id_module_name,
				template_id_entity_name,
				create_argument,
				signatories,
				observers,
				created_at::text
			FROM active_contracts
			WHERE contract_id = ${contractId}
			LIMIT 1
		`;
		return rows[0] ? mapRow<T>(rows[0]) : undefined;
	}

	// ─── getContractsByTemplate ───────────────────────────────────────────────

	/** Alias for `getActiveContracts`. */
	async getContractsByTemplate<T = Record<string, unknown>>(
		templateId: string,
		options: PqsQueryOptions = {},
	): Promise<{ contracts: PqsContract<T>[] }> {
		return this.getActiveContracts<T>(templateId, options);
	}

	// ─── close ────────────────────────────────────────────────────────────────

	/** Close the Postgres connection pool gracefully. */
	async close(): Promise<void> {
		await this.sql.close();
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTemplateId(templateId: string): {
	packageId: string;
	moduleName: string;
	entityName: string;
} {
	const parts = templateId.split(":");
	if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
		throw new Error(
			`PqsClient: invalid templateId "${templateId}". ` +
				`Expected "packageId:ModuleName:EntityName".`,
		);
	}
	return {
		packageId: parts[0] as string,
		moduleName: parts[1] as string,
		entityName: parts[2] as string,
	};
}
