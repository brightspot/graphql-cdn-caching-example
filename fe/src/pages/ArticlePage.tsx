import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';

import Byline from '../components/Byline';
import EditInCmsLink from '../components/EditInCmsLink';
import QueryState from '../components/QueryState';
import SectionKicker from '../components/SectionKicker';
import { useContentId } from '../contentIds';
import { graphql } from '../gql';
import { useDocumentTitle } from '../useDocumentTitle';

const ARTICLE_QUERY = graphql(`
  query Article($path: String) {
    Article(model: { path: $path }) {
      headline
      body
      author {
        name
        path
      }
      section {
        name
        path
      }
    }
  }
`);

export default function ArticlePage() {
  const { pathname } = useLocation();
  const variables = { path: pathname };
  const { data, loading, error } = useQuery(ARTICLE_QUERY, { variables });
  const contentId = useContentId(ARTICLE_QUERY, variables);
  const article = data?.Article;

  // The body is plain text with blank lines between paragraphs.
  const paragraphs = (article?.body ?? '').split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  useDocumentTitle(article?.headline);

  return (
    <QueryState loading={loading} error={error} found={Boolean(article)}>
      <article className="article">
        <header className="article__header">
          <SectionKicker section={article?.section} />
          <h1 className="article__headline">{article?.headline}</h1>
          <Byline author={article?.author} />
          <EditInCmsLink id={contentId} />
        </header>
        <div className="article__body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </QueryState>
  );
}
