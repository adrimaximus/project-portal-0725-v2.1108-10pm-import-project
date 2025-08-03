import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/40">
      <Header />
      <main className="container mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;