"use client";

import { useNexusClient } from "@nexus-framework/react";
import { useState, useTransition } from "react";
import { createIouAction } from "../app/contracts/actions";

interface Props {
	defaultPartyId: string;
}

export function CreateIouForm({ defaultPartyId }: Props) {
	const client = useNexusClient();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Silence the unused variable — client is available for direct mutations
	void client;

	const handleSubmit = (formData: FormData) => {
		setError(null);
		setSuccess(false);
		startTransition(async () => {
			const result = await createIouAction(formData);
			if (result.success) {
				setSuccess(true);
			} else {
				setError(result.error ?? "Unknown error");
			}
		});
	};

	return (
		<div className="card">
			<h2>Create Iou</h2>
			<form action={handleSubmit}>
				<div>
					<label htmlFor="owner">Owner Party ID</label>
					<input
						id="owner"
						name="owner"
						type="text"
						defaultValue={defaultPartyId}
						placeholder="Alice::122059a10c..."
						required
					/>
				</div>
				<div>
					<label htmlFor="amount">Amount</label>
					<input
						id="amount"
						name="amount"
						type="number"
						min="1"
						defaultValue="100"
						required
					/>
				</div>
				<div>
					<label htmlFor="currency">Currency</label>
					<input
						id="currency"
						name="currency"
						type="text"
						defaultValue="USD"
						maxLength={3}
						required
					/>
				</div>

				{error && <p className="error">{error}</p>}
				{success && (
					<p style={{ color: "#15803d", fontSize: "0.875rem" }}>
						Contract created successfully!
					</p>
				)}

				<button type="submit" className="btn-primary" disabled={isPending}>
					{isPending ? "Submitting…" : "Create Contract"}
				</button>
			</form>
		</div>
	);
}
