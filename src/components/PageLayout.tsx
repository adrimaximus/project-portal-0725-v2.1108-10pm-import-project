import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  summary?: React.ReactNode;
  noPadding?: boolean;
  disableMainScroll?: boolean;
}

const PageLayout = ({ children, summary, noPadding, disableMainScroll }: PageLayoutProps) => {
  return (
    <div className="flex flex-1 h-full">
      <div className={cn("flex-1", !disableMainScroll && "overflow-y-auto")}>
        <div className={cn(!noPadding && "p-4 md:p-6")}>
          {children}
        </div>
      </div>
      {summary && (
        <aside className="hidden xl:block w-80 border-l overflow-y-auto">
          {summary}
        </aside>
      )}
    </div>
  );
};

export default PageLayout;