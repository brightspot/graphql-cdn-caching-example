import { useSyncExternalStore } from 'react';

export interface GraphQLRequest {
  method: string;
  operationName: string | null;
  variables: unknown;
  sentQuery: boolean;
}

export interface RequestLogEntry {
  id: number;
  time: string;
  operationName: string | null;
  path: string | null;
  method: string;
  kind: 'full query' | 'hash only';
  status: number;
  cache: string;
  // Until the response headers arrived. Missing on entries saved before durations were recorded.
  durationMs?: number;
}

const MAX_ENTRIES = 50;
const STORAGE_KEY = 'requestLog';
const listeners = new Set<() => void>();
let entries: RequestLogEntry[] = loadEntries();
let nextId = entries.reduce((max, entry) => Math.max(max, entry.id + 1), 0);

// Kept in sessionStorage so the log survives reloads of this tab, and starts empty in a new one.
function loadEntries(): RequestLogEntry[] {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? (stored as RequestLogEntry[]).slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function setEntries(next: RequestLogEntry[]): void {
  entries = next;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Kept in memory only.
  }

  listeners.forEach((listener) => listener());
}

// Apollo sends GETs with the operation in the query string and POSTs with it in a JSON body.
export function parseGraphQLRequest(uri: string, init: RequestInit | undefined): GraphQLRequest {
  const method = (init?.method ?? 'POST').toUpperCase();

  if (method === 'GET') {
    const params = new URL(uri, window.location.origin).searchParams;
    const variables = params.get('variables');

    return {
      method,
      operationName: params.get('operationName'),
      variables: variables ? JSON.parse(variables) : {},
      sentQuery: params.has('query'),
    };
  }

  const body: { operationName?: string; query?: string; variables?: unknown } =
    typeof init?.body === 'string' ? JSON.parse(init.body) : {};

  return {
    method,
    operationName: body.operationName ?? null,
    variables: body.variables ?? {},
    sentQuery: Boolean(body.query),
  };
}

export function recordRequest(request: GraphQLRequest, response: Response, durationMs: number): void {
  const path = (request.variables as { path?: unknown } | null)?.path;

  const entry: RequestLogEntry = {
    id: nextId++,
    time: new Date().toLocaleTimeString(),
    operationName: request.operationName,
    path: typeof path === 'string' ? path : null,
    method: request.method,
    kind: request.sentQuery ? 'full query' : 'hash only',
    status: response.status,
    cache: response.headers.get('X-Cache') ?? '—',
    durationMs,
  };

  setEntries([entry, ...entries].slice(0, MAX_ENTRIES));
}

export function clearRequestLog(): void {
  setEntries([]);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRequestLog(): RequestLogEntry[] {
  return useSyncExternalStore(subscribe, () => entries);
}
