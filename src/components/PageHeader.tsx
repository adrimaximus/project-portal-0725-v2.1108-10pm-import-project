import React from 'react';

type PageHeaderProps = {
  title: string;
};

const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <header className="p-4 border-b bg-card">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
};

export default PageHeader;