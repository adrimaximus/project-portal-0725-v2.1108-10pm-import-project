import React from 'react';

const PortalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Placeholder for a sidebar component */}
      <aside className="w-64 flex-shrink-0 bg-background border-r hidden md:flex flex-col">
         <div className="h-16 border-b flex items-center px-6">
            <h1 className="font-bold text-lg">My App</h1>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            {/* Placeholder for nav items */}
            <p className="text-sm text-muted-foreground">Navigation</p>
         </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Placeholder for a header component */}
        <header className="h-16 border-b bg-background flex items-center px-6 justify-between">
            <div></div>
            <div>
                <p>User Profile</p>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;