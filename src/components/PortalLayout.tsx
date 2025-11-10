import React from 'react';

const PortalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <main>{children}</main>
    </div>
  );
};

export default PortalLayout;