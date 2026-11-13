import { Link } from 'react-router-dom';

import { graphql } from '../gql';
import type { ArticlePromoFieldsFragment } from '../gql/graphql';
import Byline from './Byline';
import SectionKicker from './SectionKicker';

// Codegen adds this fragment to every query that spreads ...ArticlePromoFields.
export const ARTICLE_PROMO_FIELDS = graphql(`
  fragment ArticlePromoFields on ArticlePromo {
    headline
    path
    author {
      name
      path
    }
    section {
      name
      path
    }
  }
`);

interface ArticleListProps {
  articles?: ReadonlyArray<ArticlePromoFieldsFragment | null> | null;
  // Shows the first article as a larger lead story.
  lead?: boolean;
  // Hides each article's section label, for pages that are already about one section.
  hideSection?: boolean;
}

export default function ArticleList({ articles, lead = false, hideSection = false }: ArticleListProps) {
  const items = (articles ?? []).filter((article): article is ArticlePromoFieldsFragment => article != null);

  if (items.length === 0) {
    return <p className="notice">No articles yet.</p>;
  }

  return (
    <ul className="stories">
      {items.map((article, index) => (
        <li key={article.path ?? index} className={lead && index === 0 ? 'story story--lead' : 'story'}>
          {!hideSection && <SectionKicker section={article.section} />}
          <h2 className="story__headline">
            {article.path ? <Link to={article.path}>{article.headline}</Link> : article.headline}
          </h2>
          <Byline author={article.author} />
        </li>
      ))}
    </ul>
  );
}
