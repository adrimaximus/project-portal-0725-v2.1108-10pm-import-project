import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: ReactNode;
  pageHeader?: ReactNode;
  pageTitle?: string;
  noPadding?: boolean;
  disableMainScroll?: boolean;
  summary?: ReactNode;
}

const PortalLayout = ({ 
  children, 
  pageHeader, 
  pageTitle, 
  noPadding = false, 
  disableMainScroll = false, 
  summary 
}: PortalLayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-row overflow-hidden">
        <main className={cn(
          "flex-1 overflow-x-hidden",
          disableMainScroll ? "overflow-y-hidden" : "overflow-y-auto"
        )}>
          <div className="container mx-auto">
            {pageHeader ? (
              <header className="py-4 md:py-6">{pageHeader}</header>
            ) : pageTitle ? (
              <header className="py-4 md:py-6 px-4 md:px-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageTitle}</h1>
              </header>
            ) : null}
            <div className={cn(!noPadding && "p-4 md:p-6")}>
              {children}
            </div>
          </div>
        </main>
        {summary && (
          <aside className="hidden lg:block w-96 bg-card border-l overflow-y-auto">
            {summary}
          </aside>
        )}
      </div>
    </div>
  );
};

export default PortalLayout;