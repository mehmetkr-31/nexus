"use client";

import type { ActiveContract } from "@nexus-framework/react";
import { useTransition } from "react";
import { archiveIouAction } from "../app/contracts/actions";
import { nexus } from "../lib/nexus-client";

interface IouPayload {
	owner: string;
	amount: string;
	currency: string;
}

const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

export function IouList() {
	const { data, isLoading, error } = nexus.useContracts<IouPayload>({
		templateId: IOU_TEMPLATE_ID,
	});

	if (isLoading) return <div className="card empty">Loading contracts…</div>;
	if (error) return <div className="card error">Error: {error.message}</div>;

	const contracts = data?.contracts ?? [];

	return (
		<div className="card">
			<h2>Active Iou Contracts ({contracts.length})</h2>
			{contracts.length === 0 ? (
				<p className="empty">No Iou contracts found. Create one to get started.</p>
			) : (
				<table>
					<thead>
						<tr>
							<th>Contract ID</th>
							<th>Owner</th>
							<th>Amount</th>
							<th>Currency</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{contracts.map((c) => (
							<IouRow key={c.contractId} contract={c} />
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

function IouRow({ contract }: { contract: ActiveContract<IouPayload> }) {
	const [isPending, startTransition] = useTransition();
	const owner = contract.signatories[0] ?? contract.payload.owner;

	const handleArchive = () => {
		startTransition(async () => {
			await archiveIouAction(contract.contractId, owner);
		});
	};

	return (
		<tr>
			<td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
				{contract.contractId.slice(0, 12)}…
			</td>
			<td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
				{contract.payload.owner.slice(0, 16)}…
			</td>
			<td>{contract.payload.amount}</td>
			<td>
				<span className="badge">{contract.payload.currency}</span>
			</td>
			<td>
				<button
					type="button"
					className="btn-danger"
					onClick={handleArchive}
					disabled={isPending}
					style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
				>
					{isPending ? "…" : "Archive"}
				</button>
			</td>
		</tr>
	);
}
