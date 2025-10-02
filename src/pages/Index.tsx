import React from 'react';

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome!</h1>
      <p className="text-lg text-gray-600">
        Press{" "}
        <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          Ctrl
        </kbd>{" "}
        +{" "}
        <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          K
        </kbd>{" "}
        to open the command palette.
      </p>
    </div>
  );
};

export default Index;