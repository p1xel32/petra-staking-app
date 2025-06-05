// src/components/Layout/AppFooter.jsx
import React from 'react';

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  const MAIN_APP_URL = "/";
  const APY_CALCULATOR_URL = "/tools/aptos-staking-apy-calculator";
  const LOCKUP_VISUALIZER_URL = "/tools/aptos-staking-lockup-visualizer";

  const BLOG_BASE_URL = "/blog"; 
  const FAQ_URL_BLOG = `${BLOG_BASE_URL}/faq`;
  const ABOUT_URL_BLOG = `${BLOG_BASE_URL}/about`;
  const CONTACT_URL_BLOG = `${BLOG_BASE_URL}/contact`;
  const DISCLAIMER_URL_BLOG = `${BLOG_BASE_URL}/legal/disclaimer`;
  const TERMS_URL_BLOG = `${BLOG_BASE_URL}/legal/terms`;

  return (
    <footer className="text-center py-8 text-zinc-400 text-sm border-t border-white/10 mt-16">
      <div className="container mx-auto px-4">
        <nav className="mb-3 space-x-2 sm:space-x-4" aria-label="Footer navigation">
          <a href={MAIN_APP_URL} className="hover:text-purple-400 transition-colors">
            Main App
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={APY_CALCULATOR_URL} className="hover:text-purple-400 transition-colors">
            APY Calculator
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={LOCKUP_VISUALIZER_URL} className="hover:text-purple-400 transition-colors">
            Lockup Visualizer
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={BLOG_BASE_URL} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            Blog
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={FAQ_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            FAQ
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={ABOUT_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            About
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={CONTACT_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
        </nav>

        <div className="mb-3 text-xs space-x-2 sm:space-x-4">
          <a href={DISCLAIMER_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            Disclaimer
          </a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={TERMS_URL_BLOG} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </a>
        </div>

        <p>&copy; {currentYear} aptcore.one — Secure & Transparent Aptos (APT) Staking. Your trusted platform.</p>
      </div>
    </footer>
  );
};

export default AppFooter;