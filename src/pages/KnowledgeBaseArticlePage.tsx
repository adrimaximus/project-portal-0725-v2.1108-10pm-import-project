import PortalLayout from '@/components/PortalLayout';
import React from 'react';
import { useParams } from 'react-router-dom';

const KnowledgeBaseArticlePage = () => {
  const { articleSlug } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Knowledge Base Article: {articleSlug}</h1>
    </PortalLayout>
  );
};

export default KnowledgeBaseArticlePage;