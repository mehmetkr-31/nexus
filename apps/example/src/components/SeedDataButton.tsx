"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { nexus } from "../lib/nexus-client";

const MOCK_DATA = [
	{ amount: "100.00", currency: "USD", description: "Coffee Fund" },
	{ amount: "250.50", currency: "EUR", description: "Travel Expense" },
	{ amount: "10.00", currency: "GBP", description: "Lunch" },
	{ amount: "1500.00", currency: "USD", description: "Rent" },
	{ amount: "42.00", currency: "TRY", description: "Tea Time" },
];

export function SeedDataButton({ partyId }: { partyId: string }) {
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const { mutateAsync } = nexus.useCreateContract();

	const handleSeed = async () => {
		setStatus("loading");
		try {
			// Sequential creation to avoid sandbox congestion during init
			for (const data of MOCK_DATA) {
				await mutateAsync({
					templateId: "nexus-example:Iou:Iou",
					createArguments: {
						owner: partyId,
						amount: data.amount,
						currency: data.currency,
						observers: [],
					},
					actAs: [partyId],
				});
			}
			setStatus("success");
			setTimeout(() => setStatus("idle"), 3000);
		} catch (err) {
			console.error("Seeding failed:", err);
			setStatus("error");
			setTimeout(() => setStatus("idle"), 3000);
		}
	};

	return (
		<motion.button
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			onClick={handleSeed}
			disabled={status === "loading" || status === "success" || status === "error"}
			className={`
				w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-500
				${
					status === "success"
						? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
						: status === "error"
							? "bg-red-500 text-white shadow-lg shadow-red-500/20"
							: "bg-brand-gradient text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50"
				}
				disabled:opacity-80 disabled:cursor-not-allowed
			`}
		>
			<AnimatePresence mode="wait">
				{status === "loading" ? (
					<motion.div
						key="loading"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						className="flex items-center gap-2"
					>
						<Loader2 className="animate-spin" size={20} />
						<span>Populating Ledger...</span>
					</motion.div>
				) : status === "success" ? (
					<motion.div
						key="success"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						className="flex items-center gap-2"
					>
						<Check size={20} />
						<span>Ledger Hydrated</span>
					</motion.div>
				) : status === "error" ? (
					<motion.div
						key="error"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						className="flex items-center gap-2"
					>
						<AlertCircle size={20} />
						<span>Seeding Failed</span>
					</motion.div>
				) : (
					<motion.div
						key="idle"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						className="flex items-center gap-2"
					>
						<Sparkles size={20} />
						<span>Seed Mock Data</span>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.button>
	);
}
