import { useEffect, useState } from 'react';

// A per-browser preference. Falls back to the default when storage is unavailable, e.g. in a private window.
export function useStoredBoolean(key: string, defaultValue: () => boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);

      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // Use the default.
    }

    return defaultValue();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Not remembered, which is fine.
    }
  }, [key, value]);

  return [value, setValue];
}
