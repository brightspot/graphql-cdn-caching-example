import type { ApolloError } from '@apollo/client';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface QueryStateProps {
  loading: boolean;
  error?: ApolloError;
  found: boolean;
  children?: ReactNode;
}

export default function QueryState({ loading, error, found, children }: QueryStateProps) {
  if (error) {
    return (
      <div className="notice notice--error">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!found) {
    return loading ? (
      <p className="notice notice--loading">Loading…</p>
    ) : (
      <div className="notice">
        <h1>Page not found</h1>
        <p>
          <Link to="/">Back to the front page</Link>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
