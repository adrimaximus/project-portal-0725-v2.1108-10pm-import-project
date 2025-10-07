import PortalLayout from '@/components/PortalLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

const KnowledgeBaseFolderPage = () => {
  const { folderSlug } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Knowledge Base Folder: {folderSlug}</h1>
    </PortalLayout>
  );
};

export default KnowledgeBaseFolderPage;