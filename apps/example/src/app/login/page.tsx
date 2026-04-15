"use client";

import { SANDBOX_USERS } from "@/lib/constants";
import { nexus } from "@/lib/nexus-client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/";

	const [selectedUser, setSelectedUser] = useState<string>("alice");
	const login = nexus.auth.useLogin();

	const handleLogin = () => {
		login.mutate(
			{ userId: selectedUser },
			{
				onSuccess: () => {
					// Redirect to original page or home
					window.location.href = redirectTo;
				},
			},
		);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Nexus Example App
					</h1>
					<p className="text-gray-600 dark:text-gray-400">Select a sandbox user to continue</p>
				</div>

				<div className="space-y-6">
					{/* User Selection */}
					<div>
						<label
							htmlFor="user-select"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
						>
							Select User
						</label>
						<select
							id="user-select"
							value={selectedUser}
							onChange={(e) => setSelectedUser(e.target.value)}
							disabled={login.isPending}
							className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
						>
							{SANDBOX_USERS.map((user) => (
								<option key={user} value={user}>
									{user.charAt(0).toUpperCase() + user.slice(1)}
								</option>
							))}
						</select>
					</div>

					{/* User Description */}
					<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
						<p className="text-sm text-blue-800 dark:text-blue-300">
							{selectedUser === "alice" && "Alice is a party administrator with full access."}
							{selectedUser === "bob" && "Bob is a regular user with standard permissions."}
							{selectedUser === "charlie" && "Charlie is an observer with read-only access."}
						</p>
					</div>

					{/* Error Message */}
					{login.error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
							<p className="text-sm text-red-800 dark:text-red-300">{login.error.message}</p>
						</div>
					)}

					{/* Login Button */}
					<button
						type="button"
						onClick={handleLogin}
						disabled={login.isPending}
						className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                     text-white font-semibold py-3 px-4 rounded-lg
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:cursor-not-allowed"
					>
						{login.isPending ? (
							<span className="flex items-center justify-center">
								<svg
									className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
								Logging in...
							</span>
						) : (
							`Login as ${selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1)}`
						)}
					</button>

					{/* Info Banner */}
					<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
						<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
							This is a development sandbox. Users are automatically provisioned in Canton.
							<br />
							<span className="text-blue-600 dark:text-blue-400">NOT for production use.</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
