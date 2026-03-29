"use client";

import type { ActiveContract, TemplateId } from "@nexus-framework/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NexusClientPlugin } from "./tanstack-query.ts";

// ─── Single-stream state ──────────────────────────────────────────────────────

export interface StreamContractsState<T = Record<string, unknown>> {
	/** Current set of active contracts (reflects creates + archives) */
	contracts: ActiveContract<T>[];
	/** True once the initial ACS snapshot is fully delivered */
	isLive: boolean;
	/** True when the underlying WebSocket connection is open */
	connected: boolean;
	/** Set if the WebSocket encountered an error */
	error: Error | null;
	/** Manually close the stream */
	close: () => void;
	/**
	 * Inject a new bearer token into the active stream.
	 * The current connection is closed and a new one is opened transparently.
	 * Use this to keep long-lived streams alive after JWT rotation.
	 */
	updateToken: (newToken: string) => void;
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

// ─── Multi-stream ─────────────────────────────────────────────────────────────

export interface MultiStreamEntry {
	/** Unique key to identify this stream in the result map */
	key: string;
	templateId: string;
	parties?: string[];
}

export type MultiStreamContractsState<TMap extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>> = {
	[K in keyof TMap]: ActiveContract<TMap[K]>[];
} & {
	/** True when ALL streams have received their initial ACS snapshot */
	isLive: boolean;
	/** True when ALL streams have an open WebSocket connection */
	connected: boolean;
	/** First error encountered across all streams, or null */
	error: Error | null;
	/** Close all streams */
	close: () => void;
	/** Update the token on all active streams */
	updateToken: (newToken: string) => void;
};

export interface UseMultiStreamContractsOptions {
	streams: MultiStreamEntry[];
	/** Called when ALL streams are live */
	onAllLive?: () => void;
	/** Called when any stream errors */
	onError?: (key: string, error: Error) => void;
	/** If false, no streams are opened. Default: true */
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
	 * const { contracts, isLive, connected, updateToken } = nexus.useStreamContracts<IouPayload>({
	 *   templateId: "pkg:Iou:Iou",
	 *   parties: ["Alice::..."],
	 * });
	 * ```
	 */
	useStreamContracts: <T = Record<string, unknown>>(
		options: UseStreamContractsOptions<T>,
	) => StreamContractsState<T>;

	/**
	 * Stream multiple templates simultaneously over independent WebSocket connections.
	 *
	 * Each stream is keyed by the `key` field in the `streams` array.
	 * `isLive` and `connected` are aggregate — true only when all streams qualify.
	 *
	 * @example
	 * ```tsx
	 * const { ious, transfers, isLive } = nexus.useMultiStreamContracts({
	 *   streams: [
	 *     { key: "ious", templateId: "pkg:Iou:Iou" },
	 *     { key: "transfers", templateId: "pkg:Iou:Transfer" },
	 *   ],
	 * });
	 * ```
	 */
	useMultiStreamContracts: <
		TMap extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>,
	>(
		options: UseMultiStreamContractsOptions,
	) => MultiStreamContractsState<TMap>;
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
 *     streamingPlugin(),  // adds nexus.useStreamContracts + nexus.useMultiStreamContracts
 *   ],
 * });
 * ```
 */
export function streamingPlugin(): NexusClientPlugin {
	return {
		id: "streaming",

		getActions: (client): StreamingActions => ({
			// ─── useStreamContracts ───────────────────────────────────────────────

			useStreamContracts: <T = Record<string, unknown>>(
				opts: UseStreamContractsOptions<T>,
			): StreamContractsState<T> => {
				const [contracts, setContracts] = useState<ActiveContract<T>[]>([]);
				const [isLive, setIsLive] = useState(false);
				const [connected, setConnected] = useState(false);
				const [error, setError] = useState<Error | null>(null);
				const handleRef = useRef<import("@nexus-framework/core").StreamHandle | null>(null);

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
					setConnected(false);
					setError(null);

					client.http
						.streamActiveContracts<T>(
							opts.templateId,
							{
								onCreate: (contract) => {
									if (cancelled) return;
									setContracts((prev) => {
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
								onConnectedChange: (isConnected: boolean) => {
									if (cancelled) return;
									setConnected(isConnected);
								},
							},
							{ parties: opts.parties },
						)
						.then((streamHandle) => {
							if (cancelled) {
								streamHandle.close();
								return;
							}
							handleRef.current = streamHandle;
						})
						.catch((err: unknown) => {
							if (cancelled) return;
							const streamError = err instanceof Error ? err : new Error(String(err));
							setError(streamError);
							onErrorRef.current?.(streamError);
						});

					return () => {
						cancelled = true;
						handleRef.current?.close();
						handleRef.current = null;
					};
				}, [opts.templateId, opts.parties?.join(","), enabled]);

				const close = useCallback(() => {
					handleRef.current?.close();
					handleRef.current = null;
				}, []);

				const updateToken = useCallback((newToken: string) => {
					handleRef.current?.updateToken(newToken);
				}, []);

				return { contracts, isLive, connected, error, close, updateToken };
			},

			// ─── useMultiStreamContracts ──────────────────────────────────────────

			useMultiStreamContracts: <
				TMap extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>,
			>(
				opts: UseMultiStreamContractsOptions,
			): MultiStreamContractsState<TMap> => {
				type ContractsMap = Record<string, ActiveContract<Record<string, unknown>>[]>;

				const [contractsMap, setContractsMap] = useState<ContractsMap>(() =>
					Object.fromEntries(opts.streams.map((s) => [s.key, []])),
				);
				const [liveSet, setLiveSet] = useState<Set<string>>(new Set());
				const [connectedSet, setConnectedSet] = useState<Set<string>>(new Set());
				const [error, setError] = useState<Error | null>(null);
				const handlesRef = useRef<Map<string, import("@nexus-framework/core").StreamHandle>>(new Map());

				const onAllLiveRef = useRef(opts.onAllLive);
				const onErrorRef = useRef(opts.onError);
				onAllLiveRef.current = opts.onAllLive;
				onErrorRef.current = opts.onError;

				const enabled = opts.enabled !== false;
				// stable key from streams array to detect changes
				const streamsKey = opts.streams.map((s) => `${s.key}:${s.templateId}:${(s.parties ?? []).join(",")}`).join("|");

				// biome-ignore lint/correctness/useExhaustiveDependencies: streamsKey captures full identity
				useEffect(() => {
					if (!enabled) return;

					let cancelled = false;

					// Reset
					setContractsMap(Object.fromEntries(opts.streams.map((s) => [s.key, []])));
					setLiveSet(new Set());
					setConnectedSet(new Set());
					setError(null);

					const totalKeys = new Set(opts.streams.map((s) => s.key));

					const openStreams = opts.streams.map(({ key, templateId, parties }) =>
						client.http
							.streamActiveContracts(
								templateId,
								{
									onCreate: (contract) => {
										if (cancelled) return;
										setContractsMap((prev) => {
											const existing = prev[key] ?? [];
											if (existing.some((c) => c.contractId === contract.contractId)) return prev;
											return { ...prev, [key]: [...existing, contract] };
										});
									},
									onArchive: (contractId: string) => {
										if (cancelled) return;
										setContractsMap((prev) => ({
											...prev,
											[key]: (prev[key] ?? []).filter((c) => c.contractId !== contractId),
										}));
									},
									onLive: () => {
										if (cancelled) return;
										setLiveSet((prev) => {
											const next = new Set(prev);
											next.add(key);
											if (next.size === totalKeys.size) {
												onAllLiveRef.current?.();
											}
											return next;
										});
									},
									onError: (err: Error) => {
										if (cancelled) return;
										setError(err);
										onErrorRef.current?.(key, err);
									},
									onClose: () => {
										if (cancelled) return;
										setLiveSet((prev) => { const s = new Set(prev); s.delete(key); return s; });
									},
									onConnectedChange: (isConnected: boolean) => {
										if (cancelled) return;
										setConnectedSet((prev) => {
											const next = new Set(prev);
											if (isConnected) next.add(key); else next.delete(key);
											return next;
										});
									},
								},
								{ parties },
							)
							.then((handle) => {
								if (cancelled) { handle.close(); return; }
								handlesRef.current.set(key, handle);
							})
							.catch((err: unknown) => {
								if (cancelled) return;
								const streamError = err instanceof Error ? err : new Error(String(err));
								setError(streamError);
								onErrorRef.current?.(key, streamError);
							}),
					);

					void openStreams; // fire-and-forget, handles stored in ref

					return () => {
						cancelled = true;
						for (const handle of handlesRef.current.values()) handle.close();
						handlesRef.current.clear();
					};
				}, [streamsKey, enabled]);

				const close = useCallback(() => {
					for (const handle of handlesRef.current.values()) handle.close();
					handlesRef.current.clear();
				}, []);

				const updateToken = useCallback((newToken: string) => {
					for (const handle of handlesRef.current.values()) handle.updateToken(newToken);
				}, []);

				const totalKeys = opts.streams.map((s) => s.key);
				const isLive = liveSet.size === totalKeys.length && totalKeys.length > 0;
				const connected = connectedSet.size === totalKeys.length && totalKeys.length > 0;

				return {
					...(contractsMap as Record<keyof TMap, ActiveContract<Record<string, unknown>>[]>),
					isLive,
					connected,
					error,
					close,
					updateToken,
				} as MultiStreamContractsState<TMap>;
			},
		}),
	};
}
