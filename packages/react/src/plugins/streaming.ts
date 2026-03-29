"use client";

import type { ActiveContract, TemplateId } from "@nexus-framework/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NexusClientPlugin } from "./tanstack-query.ts";

// ─── Streaming state ──────────────────────────────────────────────────────────

export interface StreamContractsState<T = Record<string, unknown>> {
	/** Current set of active contracts (reflects creates + archives) */
	contracts: ActiveContract<T>[];
	/** True once the initial ACS snapshot is fully delivered */
	isLive: boolean;
	/** Set if the WebSocket encountered an error */
	error: Error | null;
	/** Manually close the stream */
	close: () => void;
}

export interface UseStreamContractsOptions<_T = Record<string, unknown>> {
	templateId: string;
	/**
	 * Party IDs to query as. Pass a stable reference (useMemo / module-level const)
	 * to avoid unnecessary re-subscriptions.
	 */
	parties?: string[];
	/** Called when the initial ACS snapshot is complete */
	onLive?: () => void;
	/** Called on WebSocket error */
	onError?: (error: Error) => void;
	/** If false, stream is not opened. Default: true */
	enabled?: boolean;
}

// ─── StreamingActions ─────────────────────────────────────────────────────────

export interface StreamingActions extends Record<string, unknown> {
	/**
	 * Stream active contracts in real-time via WebSocket.
	 *
	 * Maintains a live set of contracts, applying creates and archives
	 * as they arrive. The stream is automatically cleaned up when the
	 * component unmounts.
	 *
	 * @example
	 * ```tsx
	 * const { contracts, isLive } = nexus.useStreamContracts<IouPayload>({
	 *   templateId: "pkg:Iou:Iou",
	 *   parties: ["Alice::..."],
	 * });
	 * ```
	 */
	useStreamContracts: <T = Record<string, unknown>>(
		options: UseStreamContractsOptions<T>,
	) => StreamContractsState<T>;
}

// ─── streamingPlugin ──────────────────────────────────────────────────────────

/**
 * Plugin that adds real-time WebSocket streaming hooks to the Nexus client.
 *
 * Requires a Canton JSON API endpoint that supports WebSocket ACS streaming.
 *
 * @example
 * ```ts
 * const nexus = createNexusClient({
 *   baseUrl: "http://localhost:7575",
 *   plugins: [
 *     sandboxAuth({ ... }),
 *     tanstackQueryPlugin(),
 *     streamingPlugin(),  // adds nexus.useStreamContracts
 *   ],
 * });
 * ```
 */
export function streamingPlugin(): NexusClientPlugin {
	return {
		id: "streaming",

		getActions: (client): StreamingActions => ({
			useStreamContracts: <T = Record<string, unknown>>(
				opts: UseStreamContractsOptions<T>,
			): StreamContractsState<T> => {
				const [contracts, setContracts] = useState<ActiveContract<T>[]>([]);
				const [isLive, setIsLive] = useState(false);
				const [error, setError] = useState<Error | null>(null);
				const closeRef = useRef<(() => void) | null>(null);

				// Keep callbacks in refs so they're always latest without re-subscribing
				const onLiveRef = useRef(opts.onLive);
				const onErrorRef = useRef(opts.onError);
				onLiveRef.current = opts.onLive;
				onErrorRef.current = opts.onError;

				const enabled = opts.enabled !== false;

				// biome-ignore lint/correctness/useExhaustiveDependencies: opts.parties is intentionally used as-is; callers should pass a stable reference
				useEffect(() => {
					if (!enabled) return;

					let cancelled = false;

					// Reset state on each new subscription
					setContracts([]);
					setIsLive(false);
					setError(null);

					client.http
						.streamActiveContracts<T>(
							opts.templateId,
							{
								onCreate: (contract) => {
									if (cancelled) return;
									setContracts((prev) => {
										// Avoid duplicates
										if (prev.some((c) => c.contractId === contract.contractId)) return prev;
										return [...prev, contract];
									});
								},
								onArchive: (contractId: string, _templateId: TemplateId) => {
									if (cancelled) return;
									setContracts((prev) => prev.filter((c) => c.contractId !== contractId));
								},
								onLive: () => {
									if (cancelled) return;
									setIsLive(true);
									onLiveRef.current?.();
								},
								onError: (err: Error) => {
									if (cancelled) return;
									setError(err);
									onErrorRef.current?.(err);
								},
								onClose: () => {
									if (cancelled) return;
									setIsLive(false);
								},
							},
							{ parties: opts.parties },
						)
						.then((closeFn) => {
							if (cancelled) {
								closeFn();
								return;
							}
							closeRef.current = closeFn;
						})
						.catch((err: unknown) => {
							if (cancelled) return;
							const streamError = err instanceof Error ? err : new Error(String(err));
							setError(streamError);
							onErrorRef.current?.(streamError);
						});

					return () => {
						cancelled = true;
						closeRef.current?.();
						closeRef.current = null;
					};
				}, [opts.templateId, opts.parties?.join(","), enabled]);

				const close = useCallback(() => {
					closeRef.current?.();
					closeRef.current = null;
				}, []);

				return { contracts, isLive, error, close };
			},
		}),
	};
}
