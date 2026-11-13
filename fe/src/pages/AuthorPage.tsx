import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';

import ArticleList from '../components/ArticleList';
import EditInCmsLink from '../components/EditInCmsLink';
import PageHeader from '../components/PageHeader';
import QueryState from '../components/QueryState';
import { useContentId } from '../contentIds';
import { graphql } from '../gql';
import { useDocumentTitle } from '../useDocumentTitle';

const AUTHOR_QUERY = graphql(`
  query Author($path: String) {
    Author(model: { path: $path }) {
      name
      articles {
        ...ArticlePromoFields
      }
    }
  }
`);

export default function AuthorPage() {
  const { pathname } = useLocation();
  const variables = { path: pathname };
  const { data, loading, error } = useQuery(AUTHOR_QUERY, { variables });
  const contentId = useContentId(AUTHOR_QUERY, variables);
  const author = data?.Author;
  const articleCount = author?.articles?.filter(Boolean).length ?? 0;

  useDocumentTitle(author?.name);

  return (
    <QueryState loading={loading} error={error} found={Boolean(author)}>
      <PageHeader eyebrow="Author" title={author?.name}>
        <p className="page-header__meta">
          {articleCount === 1 ? '1 recent article' : `${articleCount} recent articles`}
        </p>
        <EditInCmsLink id={contentId} />
      </PageHeader>
      <ArticleList articles={author?.articles} />
    </QueryState>
  );
}
