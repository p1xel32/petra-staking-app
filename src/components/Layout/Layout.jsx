// src/components/Layout/Layout.jsx
import React from 'react';
import AppHeader from './AppHeader'; 
import AppFooter from './AppFooter'; 

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <AppHeader />
      <main className="flex-grow w-full">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};

export default Layout;
