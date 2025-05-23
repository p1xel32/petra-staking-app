// src/components/Layout/AppHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import aptcoreLogoUrl from '../../assets/aptcore-logo.svg'; // Ensure this path is correct relative to AppHeader.jsx
import ConnectWalletButton from '../ConnectWalletButton'; // Ensure this path is correct

const AppHeader = () => {
  // External Astro site URLs, all under /blog subfolder
  const BLOG_URL_ASTRO = "/blog"; // The main blog page
  const FAQ_URL_ASTRO = "/blog/faq"; 
  const ABOUT_URL_ASTRO = "/blog/about";
  const CONTACT_URL_ASTRO = "/blog/contact";

  // Internal React App Tool URLs
  const CALC_URL = "/tools/aptos-staking-apy-calculator";
  const LOCKUP_VISUALIZER_URL = "/tools/aptos-staking-lockup-visualizer";

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleMobileLinkClick = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { label: "APY Calculator", to: CALC_URL, external: false }, 
    { label: "Lockup Visualizer", to: LOCKUP_VISUALIZER_URL, external: false },
    { label: "Blog", href: BLOG_URL_ASTRO, external: true }, 
    { label: "FAQ", href: FAQ_URL_ASTRO, external: true }, 
    { label: "About", href: ABOUT_URL_ASTRO, external: true }, 
    { label: "Contact", href: CONTACT_URL_ASTRO, external: true } 
  ];

  return (
    <header className="relative w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        <Link
          to="/"
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 -ml-1 shrink-0"
          aria-label="aptcore.one homepage"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline text-purple-400">
            <span>aptcore</span>
            <img src={aptcoreLogoUrl} alt="" className="h-5 w-5 mx-1 relative top-px" aria-hidden="true" />
            <span>one</span>
          </h1>
        </Link>

        <div className="md:hidden ml-2 sm:ml-3">
          <button
            ref={toggleButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-300 hover:text-purple-400 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5 relative -top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-5 h-5 relative -top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m4 6H4"></path></svg>
            )}
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-x-1 sm:gap-x-2 ml-6 lg:ml-10">
          {navLinks.map(({ label, to, href, external }) =>
            external ? ( 
              <a
                key={label}
                href={href} 
                className="text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors px-2.5 py-1.5 rounded-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                to={to} 
                className="text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors px-2.5 py-1.5 rounded-md"
              >
                {label}
              </Link>
            )
          )}
        </nav>
      </div>

      <div className="flex items-center">
        <div className="flex-shrink-0">
          <ConnectWalletButton />
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="absolute top-full inset-x-0 md:hidden bg-slate-900/90 backdrop-blur-lg shadow-xl border-t border-white/10 z-40 rounded-b-lg"
        >
          <nav className="flex flex-col px-4 py-4 space-y-1.5">
            {navLinks.map(({ label, to, href, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  onClick={handleMobileLinkClick}
                  className="block text-left text-base font-medium text-zinc-200 hover:bg-purple-500/20 hover:text-purple-300 py-2.5 px-3 rounded-md transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={to}
                  onClick={handleMobileLinkClick}
                  className="block text-left text-base font-medium text-zinc-200 hover:bg-purple-500/20 hover:text-purple-300 py-2.5 px-3 rounded-md transition-colors"
                >
                  {label}
                </Link>
              ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
