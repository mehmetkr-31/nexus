"use client";

import { useState } from "react";
import { nexus } from "@/lib/nexus-client";

interface UserSwitcherProps {
	currentUser: string;
	partyId: string;
}

export function UserSwitcher({ currentUser, partyId }: UserSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const logout = nexus.auth.useLogout();

	const handleLogout = () => {
		logout.mutate(undefined, {
			onSuccess: () => {
				window.location.href = "/login";
			},
		});
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                   hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			>
				<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
					{currentUser.charAt(0).toUpperCase()}
				</div>
				<div className="text-left hidden sm:block">
					<div className="text-sm font-medium text-gray-900 dark:text-white">
						{currentUser.charAt(0).toUpperCase() + currentUser.slice(1)}
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
						{partyId.split("::")[0]}
					</div>
				</div>
				<svg
					className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Toggle menu</title>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<>
					{/* Backdrop */}
					<button
						type="button"
						className="fixed inset-0 z-10 cursor-default"
						onClick={() => setIsOpen(false)}
						onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
						aria-label="Close menu"
					/>

					{/* Dropdown Menu */}
					<div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<p className="text-sm font-medium text-gray-900 dark:text-white">Logged in as</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								{currentUser}@example.com
							</p>
							<p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono break-all">
								{partyId}
							</p>
						</div>

						<div className="p-2">
							<button
								type="button"
								onClick={handleLogout}
								disabled={logout.isPending}
								className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
							>
								{logout.isPending ? (
									<>
										<svg
											className="animate-spin h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<title>Loading</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Logging out...
									</>
								) : (
									<>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<title>Logout</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
											/>
										</svg>
										Logout
									</>
								)}
							</button>
						</div>

						<div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
							<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
								Sandbox Mode • Development Only
							</p>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
