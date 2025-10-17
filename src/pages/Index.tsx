import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const IndexPage = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome</h1>
      <p className="mb-6">This is the main page. You can manage your contacts in the People section.</p>
      <Button asChild>
        <Link to="/people">Go to People</Link>
      </Button>
    </div>
  );
};

export default IndexPage;