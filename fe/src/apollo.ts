import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

import { recordContentId } from './contentIds';
import { parseGraphQLRequest, recordRequest } from './requestLog';

const GRAPHQL_PATH = '/delivery/graphql';

// Tells Brightspot which site's permalinks to resolve paths against.
const SITE_HEADERS: Record<string, string> = import.meta.env.VITE_SITE_URL
  ? { 'X-Site': import.meta.env.VITE_SITE_URL }
  : {};

// Queries go out as GETs carrying only the query's hash, so the CDN can cache them. When Brightspot doesn't know a
// hash yet it answers PersistedQueryNotFound, and the link re-sends the full query as a POST to register it.
const persistedQueries = createPersistedQueryLink({ sha256, useGETForHashedQueries: true });

async function fetchAndRecord(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const started = performance.now();
  const response = await fetch(input, init);
  const durationMs = Math.round(performance.now() - started);
  const request = parseGraphQLRequest(String(input), init);

  recordRequest(request, response, durationMs);
  recordContentId(request.operationName, request.variables, response.headers.get('X-Content-Id'));
  return response;
}

export const client = new ApolloClient({
  link: persistedQueries.concat(new HttpLink({ uri: GRAPHQL_PATH, headers: SITE_HEADERS, fetch: fetchAndRecord })),
  cache: new InMemoryCache(),
  defaultOptions: {
    // Always revalidate against the CDN so purges show up when navigating, not only on reload.
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
