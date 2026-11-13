import { Link } from 'react-router-dom';

import type { AuthorLink } from '../gql/graphql';

export default function Byline({ author }: { author?: Pick<AuthorLink, 'name' | 'path'> | null }) {
  if (!author?.name) {
    return null;
  }

  return (
    <p className="byline">
      By {author.path ? <Link to={author.path}>{author.name}</Link> : author.name}
    </p>
  );
}
