import React from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import aptcoreLogoUrl from '../../assets/aptcore-logo.svg';

const AppHeader = () => {
  const BLOG_URL = "/blog";
  const ABOUT_URL_BLOG = "/blog/about";

  return (
    <header className="w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      <a
        href="/"
        className="flex items-baseline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 -ml-1"
        aria-label="aptcore.one homepage"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline text-purple-400">
          <span>aptcore</span>
          <img
            src={aptcoreLogoUrl}
            alt=""
            className="h-4 w-4 sm:h-5 sm:w-5 mx-1 relative top-px"
            aria-hidden="true"
            width="20" height="20"
          />
          <span>one</span>
        </h1>
      </a>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <a
          href={BLOG_URL}
          className="text-sm sm:text-base font-medium text-zinc-300 hover:text-purple-400 transition-colors duration-150 px-1.5 py-1 rounded-md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Blog
        </a>
        <a
          href={ABOUT_URL_BLOG}
          className="text-sm sm:text-base font-medium text-zinc-300 hover:text-purple-400 transition-colors duration-150 px-1.5 py-1 rounded-md"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </a>
        <WalletSelector />
      </div>
    </header>
  );
};

export default AppHeader;
