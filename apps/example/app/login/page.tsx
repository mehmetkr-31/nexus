"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

type LoginState = { error: string } | null;

export default function LoginPage() {
	const [state, action, isPending] = useActionState<LoginState, FormData>(loginAction, null);

	return (
		<main className="container" style={{ maxWidth: 440, paddingTop: "4rem" }}>
			<div className="card">
				<h2 style={{ marginBottom: "0.25rem" }}>Connect to Canton Ledger</h2>
				<p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
					Enter your Canton Sandbox credentials to continue.
				</p>

				<form action={action}>
					<div>
						<label htmlFor="userId">User ID</label>
						<input
							id="userId"
							name="userId"
							type="text"
							placeholder="alice"
							defaultValue="alice"
							required
						/>
					</div>
					<div>
						<label htmlFor="partyId">Party ID</label>
						<input
							id="partyId"
							name="partyId"
							type="text"
							placeholder="Alice::122059a10c..."
							required
						/>
					</div>
					<div>
						<label htmlFor="secret">HMAC Secret</label>
						<input
							id="secret"
							name="secret"
							type="password"
							placeholder="secret"
							defaultValue="secret"
							required
						/>
					</div>

					{state?.error && <p className="error">{state.error}</p>}

					<button type="submit" className="btn-primary" disabled={isPending} style={{ marginTop: "0.5rem" }}>
						{isPending ? "Connecting…" : "Connect"}
					</button>
				</form>
			</div>

			<p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "1rem" }}>
				No session? The app runs in <strong>sandbox demo mode</strong> — all API calls use the
				default credentials.
			</p>
		</main>
	);
}
