"use client";

import type {
	ActiveContract,
	NexusTemplateIdentifier,
	StreamHandle,
	TemplateId,
} from "@nexus-framework/core";
import { toStableTemplateId } from "@nexus-framework/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NexusClientPlugin } from "./tanstack-query.ts";

// ─── Single-stream state ──────────────────────────────────────────────────────

export interface StreamContractsState<T = unknown> {
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

export interface UseStreamContractsOptions<_T = unknown> {
	templateId: NexusTemplateIdentifier;
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

export interface MultiStreamMapping {
	[key: string]: {
		templateId: NexusTemplateIdentifier;
		parties?: string[];
	};
}

export type MultiStreamContractsState<TMap extends MultiStreamMapping> = {
	[K in keyof TMap]: ActiveContract<unknown>[];
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

export interface UseMultiStreamOptions<TMap extends MultiStreamMapping> {
	mapping: TMap;
	/** Called when ALL streams are live */
	onAllLive?: () => void;
	/** Called when any stream errors */
	onError?: (key: keyof TMap, error: Error) => void;
	/** If false, no streams are opened. Default: true */
	enabled?: boolean;
}

// ─── StreamingActions ─────────────────────────────────────────────────────────

export interface StreamingActions extends Record<string, unknown> {
	/**
	 * Stream active contracts in real-time via WebSocket.
	 */
	useStreamContracts: <T = unknown>(
		options: UseStreamContractsOptions<T>,
	) => StreamContractsState<T>;

	/**
	 * Stream multiple templates simultaneously using a mapping-based configuration.
	 */
	useMultiStream: <TMap extends MultiStreamMapping>(
		options: UseMultiStreamOptions<TMap>,
	) => MultiStreamContractsState<TMap>;
}

// ─── streamingPlugin ──────────────────────────────────────────────────────────

/**
 * Plugin that adds real-time WebSocket streaming hooks to the Nexus client.
 */
export function streamingPlugin(): NexusClientPlugin<{
	useStreamContracts: StreamingActions["useStreamContracts"];
	useMultiStream: StreamingActions["useMultiStream"];
}> {
	const activeHandles = new Set<StreamHandle>();

	return {
		id: "streaming",
		onTokenRefreshed: (newToken) => {
			for (const handle of activeHandles) {
				handle.updateToken(newToken);
			}
		},

		getActions: (client): StreamingActions => ({
			// ─── useStreamContracts ───────────────────────────────────────────────

			useStreamContracts: <T = unknown>(
				opts: UseStreamContractsOptions<T>,
			): StreamContractsState<T> => {
				const [contracts, setContracts] = useState<ActiveContract<T>[]>([]);
				const [isLive, setIsLive] = useState(false);
				const [connected, setConnected] = useState(false);
				const [error, setError] = useState<Error | null>(null);
				const handleRef = useRef<StreamHandle | null>(null);

				const onLiveRef = useRef(opts.onLive);
				const onErrorRef = useRef(opts.onError);
				onLiveRef.current = opts.onLive;
				onErrorRef.current = opts.onError;

				const enabled = opts.enabled !== false;
				const stableTemplateId = toStableTemplateId(opts.templateId);

				// biome-ignore lint/correctness/useExhaustiveDependencies: stableTemplateId and opts.parties?.join(",") capture full identity
				useEffect(() => {
					if (!enabled) return;

					let cancelled = false;
					setContracts([]);
					setIsLive(false);
					setConnected(false);
					setError(null);

					client.http
						.streamActiveContracts<T>(
							stableTemplateId,
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
							activeHandles.add(streamHandle);
						})
						.catch((err: unknown) => {
							if (cancelled) return;
							const streamError = err instanceof Error ? err : new Error(String(err));
							setError(streamError);
							onErrorRef.current?.(streamError);
						});

					return () => {
						cancelled = true;
						if (handleRef.current) {
							handleRef.current.close();
							activeHandles.delete(handleRef.current);
						}
						handleRef.current = null;
					};
				}, [stableTemplateId, opts.parties?.join(","), enabled, client.http]);

				const close = useCallback(() => {
					handleRef.current?.close();
					handleRef.current = null;
				}, []);

				const updateToken = useCallback((newToken: string) => {
					handleRef.current?.updateToken(newToken);
				}, []);

				return { contracts, isLive, connected, error, close, updateToken };
			},

			// ─── useMultiStream ──────────────────────────────────────────────────

			useMultiStream: <TMap extends MultiStreamMapping>(
				opts: UseMultiStreamOptions<TMap>,
			): MultiStreamContractsState<TMap> => {
				const [contractsMap, setContractsMap] = useState<Record<string, ActiveContract<unknown>[]>>(
					() => Object.fromEntries(Object.keys(opts.mapping).map((k) => [k, []])),
				);
				const [liveSet, setLiveSet] = useState<Set<string>>(new Set());
				const [connectedSet, setConnectedSet] = useState<Set<string>>(new Set());
				const [error, setError] = useState<Error | null>(null);
				const handlesRef = useRef<Map<string, StreamHandle>>(new Map());

				const onAllLiveRef = useRef(opts.onAllLive);
				const onErrorRef = useRef(opts.onError);
				onAllLiveRef.current = opts.onAllLive;
				onErrorRef.current = opts.onError;

				const enabled = opts.enabled !== false;
				const mappingKey = JSON.stringify(
					Object.entries(opts.mapping).map(([k, v]) => [
						k,
						toStableTemplateId(v.templateId),
						v.parties,
					]),
				);

				// biome-ignore lint/correctness/useExhaustiveDependencies: mappingKey captures full identity
				useEffect(() => {
					if (!enabled) return;

					let cancelled = false;
					setContractsMap(Object.fromEntries(Object.keys(opts.mapping).map((k) => [k, []])));
					setLiveSet(new Set());
					setConnectedSet(new Set());
					setError(null);

					const keys = Object.keys(opts.mapping);

					for (const key of keys) {
						const config = opts.mapping[key];
						if (!config) continue;
						const stableId = toStableTemplateId(config.templateId);

						client.http
							.streamActiveContracts<unknown>(
								stableId,
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
											if (next.size === keys.length) {
												onAllLiveRef.current?.();
											}
											return next;
										});
									},
									onError: (err: Error) => {
										if (cancelled) return;
										setError(err);
										onErrorRef.current?.(key as keyof TMap, err);
									},
									onClose: () => {
										if (cancelled) return;
										setLiveSet((prev) => {
											const s = new Set(prev);
											s.delete(key);
											return s;
										});
									},
									onConnectedChange: (isConnected: boolean) => {
										if (cancelled) return;
										setConnectedSet((prev) => {
											const next = new Set(prev);
											if (isConnected) next.add(key);
											else next.delete(key);
											return next;
										});
									},
								},
								{ parties: config.parties },
							)
							.then((handle) => {
								if (cancelled) {
									handle.close();
									return;
								}
								handlesRef.current.set(key, handle);
								activeHandles.add(handle);
							})
							.catch((err: unknown) => {
								if (cancelled) return;
								const streamError = err instanceof Error ? err : new Error(String(err));
								setError(streamError);
								onErrorRef.current?.(key as keyof TMap, streamError);
							});
					}

					return () => {
						cancelled = true;
						for (const handle of handlesRef.current.values()) {
							handle.close();
							activeHandles.delete(handle);
						}
						handlesRef.current.clear();
					};
				}, [mappingKey, enabled, client.http]);

				const close = useCallback(() => {
					for (const handle of handlesRef.current.values()) {
						handle.close();
						activeHandles.delete(handle);
					}
					handlesRef.current.clear();
				}, []);

				const updateToken = useCallback((newToken: string) => {
					for (const handle of handlesRef.current.values()) {
						handle.updateToken(newToken);
					}
				}, []);

				const keys = Object.keys(opts.mapping);
				const isLive = liveSet.size === keys.length && keys.length > 0;
				const connected = connectedSet.size === keys.length && keys.length > 0;

				return {
					...contractsMap,
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
