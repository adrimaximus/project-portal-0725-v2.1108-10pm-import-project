import PortalLayout from '@/components/PortalLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

const CompanyDetailPage = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Company Detail: {id}</h1>
    </PortalLayout>
  );
};

export default CompanyDetailPage;