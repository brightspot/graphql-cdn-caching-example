import { useSyncExternalStore } from 'react';
import { getOperationName } from '@apollo/client/utilities';
import type { DocumentNode } from 'graphql';

const listeners = new Set<() => void>();
const contentIds = new Map<string, string>();

function key(operationName: string | null, variables: unknown): string {
  return `${operationName}:${JSON.stringify(variables ?? {})}`;
}

export function recordContentId(operationName: string | null, variables: unknown, contentId: string | null): void {
  const recordKey = key(operationName, variables);

  if (!contentId || contentIds.get(recordKey) === contentId) {
    return;
  }

  contentIds.set(recordKey, contentId);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The ID of the content a query looked up, from the endpoint's X-Content-Id response header, so the schema doesn't
 * need to expose IDs.
 */
export function useContentId(document: DocumentNode, variables: Record<string, unknown>): string | undefined {
  const recordKey = key(getOperationName(document), variables);
  return useSyncExternalStore(subscribe, () => contentIds.get(recordKey));
}
