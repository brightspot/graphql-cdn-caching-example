import { useQuery } from '@apollo/client';

import ArticleList from '../components/ArticleList';
import EditInCmsLink from '../components/EditInCmsLink';
import PageHeader from '../components/PageHeader';
import QueryState from '../components/QueryState';
import { useContentId } from '../contentIds';
import { graphql } from '../gql';
import { useDocumentTitle } from '../useDocumentTitle';

const HOME_PAGE_QUERY = graphql(`
  query HomePage($path: String) {
    HomePage(model: { path: $path }) {
      name
      articles {
        ...ArticlePromoFields
      }
    }
  }
`);

export default function HomePage() {
  const variables = { path: '/' };
  const { data, loading, error } = useQuery(HOME_PAGE_QUERY, { variables });
  const contentId = useContentId(HOME_PAGE_QUERY, variables);
  const home = data?.HomePage;

  useDocumentTitle(null);

  return (
    <QueryState loading={loading} error={error} found={Boolean(home)}>
      <PageHeader eyebrow="Latest stories">
        <EditInCmsLink id={contentId} />
      </PageHeader>
      <ArticleList articles={home?.articles} lead />
    </QueryState>
  );
}
