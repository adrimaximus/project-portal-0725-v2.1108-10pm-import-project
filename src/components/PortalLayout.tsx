import React from 'react';

const PortalLayout = ({ 
  children, 
  noPadding = false, 
  disableMainScroll = false, 
  summary 
}: { 
  children: React.ReactNode; 
  noPadding?: boolean; 
  disableMainScroll?: boolean; 
  summary?: React.ReactNode; 
}) => {
  const paddingClass = noPadding ? "" : "p-4 sm:p-6 lg:p-8";
  const scrollClass = disableMainScroll ? "overflow-hidden h-screen" : "";

  return (
    <div className={`${paddingClass} ${scrollClass} bg-gray-900 text-white min-h-screen`}>
      {summary}
      {children}
    </div>
  );
};

export default PortalLayout;