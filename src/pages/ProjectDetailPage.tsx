import PortalLayout from '@/components/PortalLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetailPage = () => {
  const { slug } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Project Detail: {slug}</h1>
    </PortalLayout>
  );
};

export default ProjectDetailPage;