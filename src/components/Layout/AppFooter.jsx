import React from 'react';

// --- Footer Component ---
const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  const BLOG_BASE_URL = "/blog"; // Base path for blog pages
  const FAQ_URL_BLOG = `${BLOG_BASE_URL}/faq`; // FAQ page URL
  const ABOUT_URL_BLOG = `${BLOG_BASE_URL}/about`; // About page URL
  const CONTACT_URL_BLOG = `${BLOG_BASE_URL}/contact`; // Contact page URL

  return (
    <footer className="text-center py-8 text-zinc-400 text-sm border-t border-white/10 mt-16">
      <div className="container mx-auto px-4">
        {/* Footer Navigation */}
        <nav className="mb-3 space-x-2 sm:space-x-4" aria-label="Footer navigation">
          <a href="/" className="hover:text-purple-400 transition-colors">Main App</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={BLOG_BASE_URL} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Blog</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={FAQ_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">FAQ</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={ABOUT_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">About</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={CONTACT_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Contact</a>
        </nav>

        {/* Legal Links */}
        <div className="mb-3 text-xs space-x-2 sm:space-x-4">
          <a href={`${BLOG_BASE_URL}/legal/disclaimer`} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Disclaimer</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={`${BLOG_BASE_URL}/legal/terms`} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Terms of Use</a>
        </div>

        {/* Copyright Notice */}
        <p>&copy; {currentYear} aptcore.one — Secure Aptos (APT) Staking. Stake with confidence.</p>
      </div>
    </footer>
  );
};

export default AppFooter;