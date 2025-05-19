import React, { useState, useEffect, useRef } from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import aptcoreLogoUrl from '../../assets/aptcore-logo.svg';

const AppHeader = () => {
  const BLOG_URL = "/blog";
  const ABOUT_URL_BLOG = "/blog/about";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  const breakpoint = 'md';

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleMobileLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className={`relative w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50`}>
      <div className={`flex items-center gap-x-2 ${breakpoint}:gap-x-3`}>
        <a
          href="/"
          className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 -ml-1"
          aria-label="aptcore.one homepage"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline text-purple-400">
            <span>aptcore</span>
            <img src={aptcoreLogoUrl} alt="" className="h-4 w-4 sm:h-5 sm:w-5 mx-1 relative top-px" aria-hidden="true" width="20" height="20" />
            <span>one</span>
          </h1>
        </a>

        <div className={`${breakpoint}:hidden`}>
          <button
            ref={toggleButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="text-zinc-300 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 flex items-center justify-center transform -translate-y-[4px]" // ИЗМЕНЕНИЕ: Увеличен сдвиг вверх
          >
            {isMobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        <div className={`hidden ${breakpoint}:flex items-center gap-x-2 ${breakpoint}:gap-x-3`}>
          <a
            href={BLOG_URL}
            className={`text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors duration-150 px-1.5 py-1 rounded-md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blog
          </a>
          <a
            href={ABOUT_URL_BLOG}
            className={`text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors duration-150 px-1.5 py-1 rounded-md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
        </div>
      </div>

      <div className="flex-shrink-0">
           <WalletSelector />
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className={`absolute top-full left-0 right-0 ${breakpoint}:hidden bg-slate-900/95 backdrop-blur-lg shadow-xl border-t border-white/10 z-40`}
        >
          <nav className="flex flex-col px-4 pt-3 pb-4 space-y-2">
            <a
              href={BLOG_URL}
              className="block text-left text-base font-medium text-zinc-200 hover:bg-purple-500/20 hover:text-purple-300 py-3 px-3 rounded-md transition-colors duration-150"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMobileLinkClick}
            >
              Blog
            </a>
            <a
              href={ABOUT_URL_BLOG}
              className="block text-left text-base font-medium text-zinc-200 hover:bg-purple-500/20 hover:text-purple-300 py-3 px-3 rounded-md transition-colors duration-150"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMobileLinkClick}
            >
              About
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;