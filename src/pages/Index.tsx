import React from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Home Page</h1>
      <nav>
        <Link to="/settings/integrations" className="text-blue-600 hover:underline">
          Go to Integrations
        </Link>
      </nav>
    </div>
  );
};

export default Index;