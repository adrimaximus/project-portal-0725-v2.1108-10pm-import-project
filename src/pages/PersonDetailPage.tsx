import PortalLayout from '@/components/PortalLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

const PersonDetailPage = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Person Detail: {id}</h1>
    </PortalLayout>
  );
};

export default PersonDetailPage;