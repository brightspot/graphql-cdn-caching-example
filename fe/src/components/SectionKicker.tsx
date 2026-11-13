import { Link } from 'react-router-dom';

import type { SectionLink } from '../gql/graphql';

export default function SectionKicker({ section }: { section?: Pick<SectionLink, 'name' | 'path'> | null }) {
  if (!section?.name) {
    return null;
  }

  return section.path ? (
    <Link className="kicker" to={section.path}>
      {section.name}
    </Link>
  ) : (
    <span className="kicker">{section.name}</span>
  );
}
