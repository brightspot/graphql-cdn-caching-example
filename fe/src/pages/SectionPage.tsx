import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';

import ArticleList from '../components/ArticleList';
import EditInCmsLink from '../components/EditInCmsLink';
import PageHeader from '../components/PageHeader';
import QueryState from '../components/QueryState';
import { useContentId } from '../contentIds';
import { graphql } from '../gql';
import { useDocumentTitle } from '../useDocumentTitle';

const SECTION_QUERY = graphql(`
  query Section($path: String) {
    Section(model: { path: $path }) {
      name
      articles {
        ...ArticlePromoFields
      }
    }
  }
`);

export default function SectionPage() {
  const { pathname } = useLocation();
  const variables = { path: pathname };
  const { data, loading, error } = useQuery(SECTION_QUERY, { variables });
  const contentId = useContentId(SECTION_QUERY, variables);
  const section = data?.Section;

  useDocumentTitle(section?.name);

  return (
    <QueryState loading={loading} error={error} found={Boolean(section)}>
      <PageHeader eyebrow="Section" title={section?.name}>
        <EditInCmsLink id={contentId} />
      </PageHeader>
      <ArticleList articles={section?.articles} lead hideSection />
    </QueryState>
  );
}
