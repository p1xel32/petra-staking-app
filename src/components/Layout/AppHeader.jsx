// src/components/Layout/AppHeader.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import aptcoreLogoUrl from '../../assets/aptcore-logo.svg';
import ConnectWalletButton from '../ConnectWalletButton';
import ClientOnly from '../ClientOnly';
import { PATHS } from '@/config/consts.ts';

const AppHeader = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  const currentLang = i18n.language;
  const defaultLang = 'en';

  const getLocalizedPath = (path) => {
    if (currentLang === defaultLang) {
      return path;
    }
    if (path === '/') {
        return `/${currentLang}`;
    }
    return `/${currentLang}${path}`;
  };
  
  const getBlogLocalizedPath = (path) => {
    if (currentLang === defaultLang) {
      return path;
    }
    const base = '/blog';
    const restOfPath = path.substring(base.length);
    return `${base}/${currentLang}${restOfPath}`;
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);
  
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleMobileLinkClick = () => setIsMobileMenuOpen(false);
  
  const navLinks = [
    { label: t('header.nav.blog'), href: getBlogLocalizedPath(PATHS.blog) },
    { label: t('header.nav.help'), href: getBlogLocalizedPath(PATHS.help) }
  ];

  return (
    <header className="relative w-full backdrop-blur-xl bg-black/5 border-b border-white/10 px-4 sm:px-6 py-2.5 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        <a
          href={getLocalizedPath(PATHS.home)}
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 -ml-1 shrink-0"
          aria-label={t('header.aria.homepage')}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline bg-gradient-to-r from-[#2196f3] via-[#7b61ff] to-[#b44aff] bg-clip-text text-transparent">
            <span>aptcore</span>
            <img src={aptcoreLogoUrl} alt="" className="h-5 w-5 mx-1" aria-hidden="true" />
            <span>one</span>
          </h1>
        </a>

        <div className="md:hidden ml-2 sm:ml-3">
          <button
            ref={toggleButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-300 hover:text-purple-400 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center h-8 w-8"
            aria-label={isMobileMenuOpen ? t('header.aria.closeMenu') : t('header.aria.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            )}
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-x-1 sm:gap-x-2 ml-6 lg:ml-10">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors px-2.5 py-1.5 rounded-md"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center">
        <div className="flex-shrink-0">
          <ClientOnly>
            <ConnectWalletButton />
          </ClientOnly>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="absolute top-full inset-x-0 md:hidden bg-slate-900/95 backdrop-blur-lg shadow-xl border-t border-white/10 z-40 rounded-b-lg"
        >
          <nav className="flex flex-col px-4 py-4 space-y-1.5">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={handleMobileLinkClick}
                className="block text-left text-base font-medium text-zinc-200 hover:bg-purple-500/20 hover:text-purple-300 py-2.5 px-3 rounded-md transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;