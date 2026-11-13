import { useEffect } from 'react';

export const SITE_NAME = 'Example News';

export function useDocumentTitle(title?: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
