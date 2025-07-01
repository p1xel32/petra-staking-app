// src/components/Layout/AppFooter.jsx (примерный путь)

import React from 'react';
import { Twitter, Youtube, Github } from 'lucide-react';

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  // Основные ссылки
  const MAIN_APP_URL = "/";
  const APY_CALCULATOR_URL = "/tools/aptos-staking-apy-calculator";
  const LOCKUP_VISUALIZER_URL = "/tools/aptos-staking-lockup-visualizer";
  const BLOG_BASE_URL = "/blog"; 
  const ABOUT_URL_BLOG = `${BLOG_BASE_URL}/about`;
  
  // Внешние ссылки на соцсети
  const TWITTER_URL = "https://x.com/aptcoreone";
  const YOUTUBE_URL = "https://www.youtube.com/@aptcoreone";
  const GITHUB_URL = "https://github.com/p1xel32/petra-staking-app";

  return (
    <footer className="text-center py-10 text-zinc-500 text-sm border-t border-zinc-800/50 mt-16">
      <div className="container mx-auto px-4">
        <nav className="mb-6 space-x-4 sm:space-x-8" aria-label="Footer navigation">
          <a href={MAIN_APP_URL} className="hover:text-purple-400 transition-colors">Stake</a>
          <a href={APY_CALCULATOR_URL} className="hover:text-purple-400 transition-colors">APY Calculator</a>
          <a href={LOCKUP_VISUALIZER_URL} className="hover:text-purple-400 transition-colors">Lockup Visualizer</a>
          <a href={BLOG_BASE_URL} className="hover:text-purple-400 transition-colors">Blog</a>
          <a href={ABOUT_URL_BLOG} className="hover:text-purple-400 transition-colors">About</a>
        </nav>

        <div className="flex justify-center items-center space-x-6 my-8">
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter" className="text-zinc-400 hover:text-purple-400 transition-colors">
            <Twitter size={20} />
          </a>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="Subscribe on YouTube" className="text-zinc-400 hover:text-purple-400 transition-colors">
            <Youtube size={20} />
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="View on GitHub" className="text-zinc-400 hover:text-purple-400 transition-colors">
            <Github size={20} />
          </a>
        </div>

        <div className="mb-4 text-xs space-y-1">
            <p>Secure staking infrastructure by core Aptos contributors — no slashing since day one.</p>
            <p>Verifiable On-chain</p>
        </div>

        <p>© {currentYear} aptcore.one</p>
      </div>
    </footer>
  );
};

export default AppFooter;