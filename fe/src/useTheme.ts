import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * The reader's chosen theme, or the system's until they pick one. index.html applies a stored choice before the app
 * loads, so the page doesn't flash the other theme first.
 */
export function useTheme(): [Theme, () => void] {
  const [choice, setChoice] = useState<Theme | null>(storedTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystemDark(query.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!choice) {
      return;
    }

    document.documentElement.dataset.theme = choice;

    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Not remembered, which is fine.
    }
  }, [choice]);

  const theme: Theme = choice ?? (systemDark ? 'dark' : 'light');

  return [theme, () => setChoice(theme === 'dark' ? 'light' : 'dark')];
}
