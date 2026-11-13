import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';

import QueryState from './components/QueryState';
import RequestLog from './components/RequestLog';
import ThemeToggle from './components/ThemeToggle';
import ArticlePage from './pages/ArticlePage';
import AuthorPage from './pages/AuthorPage';
import HomePage from './pages/HomePage';
import SectionPage from './pages/SectionPage';
import { SITE_NAME } from './useDocumentTitle';
import { useStoredBoolean } from './useStoredBoolean';

const TODAY = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Routes mirror the CMS permalinks: "/" for the home page, "/<section>" for sections, "/<section>/<headline>" for
// articles and "/people/<name>" for authors. Each page looks its content up by the current path.
export default function App() {
  const [logOpen, setLogOpen] = useStoredBoolean('requestLogOpen', () => true);
  const location = useLocation();
  const navigationType = useNavigationType();

  // Like a full page load, but back and forward keep their position.
  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location.key, navigationType]);

  return (
    <div className={logOpen ? 'shell shell--log-open' : 'shell'}>
      <div className="site">
        <header className="masthead">
          <ThemeToggle />
          <p className="masthead__date">{TODAY}</p>
          <Link to="/" className="masthead__title">
            {SITE_NAME}
          </Link>
          <p className="masthead__tagline">Headless Brightspot, delivered over GraphQL</p>
        </header>
        {/* Every navigation gets a new key, even to the current URL, so clicking a link to this page reloads it. */}
        <main className="page" key={location.key}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/people/:author" element={<AuthorPage />} />
            <Route path="/:section" element={<SectionPage />} />
            <Route path="/:section/:article" element={<ArticlePage />} />
            <Route path="*" element={<QueryState loading={false} found={false} />} />
          </Routes>
        </main>
      </div>
      <RequestLog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
