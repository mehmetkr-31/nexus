// ─── Raw PQS database row ─────────────────────────────────────────────────────

/**
 * Raw row from the PQS `active_contracts` table.
 * Column names are snake_case as stored in Postgres.
 */
export interface ActiveContractRow {
	contract_id: string;
	template_id_package_id: string;
	template_id_module_name: string;
	template_id_entity_name: string;
	/** Daml contract payload stored as JSONB */
	create_argument: Record<string, unknown>;
	signatories: string[];
	observers: string[];
	/** Ledger offset (cast to text to avoid bigint precision loss in JS) */
	created_at: string;
}

// ─── Application-level types ──────────────────────────────────────────────────

/**
 * A PQS contract mapped to camelCase — mirrors `ActiveContract<T>` from
 * `@nexus-framework/core` so callers can share type definitions.
 */
export interface PqsContract<T = Record<string, unknown>> {
	contractId: string;
	templateId: {
		packageId: string;
		moduleName: string;
		entityName: string;
	};
	payload: T;
	signatories: string[];
	observers: string[];
	/** Ledger offset as a decimal string */
	createdAt: string;
}

// ─── Query Options ────────────────────────────────────────────────────────────

export interface PqsQueryOptions {
	/**
	 * Filter to contracts where at least one of these parties is a signatory
	 * or observer. Uses the Postgres `&&` array overlap operator.
	 */
	parties?: string[];
	/**
	 * JSONB containment filter on the contract payload.
	 * Passed as the RHS of Postgres `create_argument @> $value::jsonb`.
	 *
	 * @example
	 * // Match all wallets where "Alice::abc" is in the owners list
	 * payloadFilter: { owners: ["Alice::abc"] }
	 */
	payloadFilter?: Record<string, unknown>;
	/** Maximum rows to return. Default: 100 */
	limit?: number;
	/** Row offset for pagination. Default: 0 */
	offset?: number;
	/**
	 * Sort order by ledger offset.
	 * @default "desc"
	 */
	order?: "asc" | "desc";
}
