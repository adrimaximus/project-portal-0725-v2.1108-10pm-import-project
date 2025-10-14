import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-card border-r p-4 hidden md:block">
        <h1 className="font-bold text-lg">Project Portal</h1>
        <nav className="mt-8">
          {/* Placeholder for navigation items */}
        </nav>
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b p-4">
          <h2 className="font-semibold">Projects</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;