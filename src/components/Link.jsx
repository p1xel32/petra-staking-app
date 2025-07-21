import React from 'react';
import { usePageContext } from '../../renderer/usePageContext.jsx';

const DEFAULT_LOCALE = 'en';

export function Link(props) {
  const pageContext = usePageContext();
  const { locale, urlPathname } = pageContext;
  const { href } = props;

  const localizedHref =
    locale === DEFAULT_LOCALE || !href.startsWith('/')
      ? href
      : `/${locale}${href === '/' ? '' : href}`;

  const isActive = href === urlPathname || (href === '/' && urlPathname === `/${locale}`);
  
  const className = [
    props.className,
    isActive && 'is-active',
  ]
    .filter(Boolean)
    .join(' ');

  return <a {...props} href={localizedHref} className={className} />;
}