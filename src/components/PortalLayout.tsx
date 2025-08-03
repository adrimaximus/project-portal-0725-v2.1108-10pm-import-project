import { Link, useLocation } from 'react-router-dom';
import { Home, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface PortalLayoutProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode;
  summary?: React.ReactNode;
  noPadding?: boolean;
  disableMainScroll?: boolean;
}

const PortalLayout = ({
  children,
  pageHeader,
  summary,
  noPadding,
  disableMainScroll,
}: PortalLayoutProps) => {
  const location = useLocation();

  const navLinks = [
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 flex-shrink-0 border-r bg-card text-card-foreground">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">GoalTracker</h1>
          </Link>
        </div>
        <nav className="px-4">
          <ul>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  to={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                    location.pathname.startsWith(href) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex flex-1">
        <main
          className={cn(
            'flex-1 flex flex-col',
            disableMainScroll ? 'overflow-y-hidden' : 'overflow-y-auto'
          )}
        >
          {pageHeader}
          <div className={cn('flex-1', !noPadding && 'p-8')}>{children}</div>
        </main>
        {summary && (
          <aside className="w-96 hidden lg:block border-l overflow-y-auto p-8">
            {summary}
          </aside>
        )}
      </div>
    </div>
  );
};

export default PortalLayout;