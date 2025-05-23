// src/components/Layout/Layout.jsx
import React from 'react';
import AppHeader from './AppHeader'; // Assuming AppHeader.jsx is in the same folder
import AppFooter from './AppFooter'; // Assuming AppFooter.jsx is in the same folder

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <AppHeader />
      <main className="flex-grow w-full"> 
        {/* Content will be rendered here. Pages can define their own containers if needed. */}
        {children}
      </main>
      <AppFooter />
    </div>
  );
};

export default Layout;