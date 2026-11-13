import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title?: string | null;
  children?: ReactNode;
}

export default function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      {title && <h1 className="page-header__title">{title}</h1>}
      {children}
    </header>
  );
}
