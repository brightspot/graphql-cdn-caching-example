import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { clearRequestLog, type RequestLogEntry, useRequestLog } from '../requestLog';

const PANEL_ID = 'request-log';

interface RequestLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestLog({ open, onOpenChange }: RequestLogProps) {
  const entries = useRequestLog();
  const { key: locationKey } = useLocation();

  if (!open) {
    return (
      <button
        type="button"
        className="request-toggle"
        aria-expanded={false}
        aria-controls={PANEL_ID}
        onClick={() => onOpenChange(true)}
      >
        GraphQL requests
        <span className="request-toggle__count">{entries.length}</span>
        {entries[0] && <CacheBadge cache={entries[0].cache} />}
      </button>
    );
  }

  return (
    <aside id={PANEL_ID} className="request-panel" aria-label="GraphQL requests">
      <div className="request-panel__header">
        <h2 className="request-panel__title">GraphQL requests</h2>
        <button type="button" className="text-button" onClick={clearRequestLog} disabled={entries.length === 0}>
          Clear
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Close GraphQL requests"
          aria-expanded={true}
          aria-controls={PANEL_ID}
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
      </div>
      {/* Keyed on the location so the timer restarts on every navigation. */}
      <PageClock key={locationKey}>
        <HitRatio entries={entries} />
      </PageClock>
      {entries.length === 0 ? (
        <p className="request-panel__empty">None yet. Browse the site to see requests here.</p>
      ) : (
        <ol className="request-panel__list">
          {entries.map((entry) => (
            <li key={entry.id} className="request">
              <div className="request__top">
                <span className="request__operation">{entry.operationName ?? 'Unnamed'}</span>
                {entry.durationMs != null && <span className="request__duration">{entry.durationMs} ms</span>}
                <CacheBadge cache={entry.cache} />
              </div>
              {entry.path && (
                <div className="request__path" title={entry.path}>
                  {entry.path}
                </div>
              )}
              <div className="request__meta">
                {entry.method} · {entry.kind} · {entry.status} · {entry.time}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="request-panel__footer">Newest first. CDN status is Varnish's X-Cache header.</p>
    </aside>
  );
}

// The current time and how long this page has been open, for timing reloads against the CDN TTL.
function PageClock({ children }: { children?: ReactNode }) {
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(openedAt);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const seconds = Math.floor((now - openedAt) / 1000);
  const onPage = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="request-panel__clock">
      <time>{new Date(now).toLocaleTimeString()}</time>
      {children}
      <span>On this page {onPage}</span>
    </div>
  );
}

// STALE counts as a hit, since Varnish answered from its cache while revalidating.
function HitRatio({ entries }: { entries: RequestLogEntry[] }) {
  const hits = entries.filter((entry) => entry.cache === 'HIT' || entry.cache === 'STALE').length;
  const total = hits + entries.filter((entry) => entry.cache === 'MISS').length;

  return (
    <span title={`${hits} of ${total} listed requests served from the CDN cache, counting STALE as a hit`}>
      Hit ratio {total === 0 ? '—' : `${Math.round((hits / total) * 100)}%`}
    </span>
  );
}

function CacheBadge({ cache }: { cache: string }) {
  return <span className={`cache-badge cache-badge--${cache.toLowerCase()}`}>{cache}</span>;
}
