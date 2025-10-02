import React from 'react';

export const PageHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const PageHeaderHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-2xl font-bold">{children}</h1>
);

export const PageHeaderDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground">{children}</p>
);