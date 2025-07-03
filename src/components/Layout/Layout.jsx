import React from 'react';
import AppHeader from './AppHeader'; 
import AppFooter from './AppFooter'; 

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white font-sans">
      
      <div className="absolute inset-0 z-0 opacity-25 blur-3xl bg-gradient-to-r from-[#2196f3] via-[#7b61ff] to-[#b44aff]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow w-full">
          {children}
        </main>
        <AppFooter />
      </div>

    </div>
  );
};

export default Layout;