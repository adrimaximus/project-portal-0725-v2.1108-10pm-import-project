import React from 'react';
import { cn } from '@/lib/utils';

interface ContentLayoutProps {
  children: React.ReactNode;
  summary?: React.ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
}

const ContentLayout = ({
  children,
  summary,
  disableMainScroll,
  noPadding,
}: ContentLayoutProps) => {
  const mainContentClasses = cn(
    'flex-1',
    !disableMainScroll && 'overflow-y-auto',
    !noPadding && 'p-4 md:p-6'
  );

  if (summary) {
    return (
      <div className="grid flex-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <main className={cn(mainContentClasses, 'md:col-span-2 lg:col-span-3')}>
          {children}
        </main>
        <aside className="hidden md:block md:col-span-1 lg:col-span-1">
          <div className="sticky top-20">{summary}</div>
        </aside>
      </div>
    );
  }

  return <main className={mainContentClasses}>{children}</main>;
};

export default ContentLayout;