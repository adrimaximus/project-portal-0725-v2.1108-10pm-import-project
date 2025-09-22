import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Loader2 } from 'lucide-react';
import EmbedRenderer from '@/components/EmbedRenderer';

const CustomPage = () => {
  const { pageId } = useParams<{ pageId: string }>();

  const { data: navItem, isLoading } = useQuery({
    queryKey: ['user_navigation_item', pageId],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_navigation_items').select('name, url').eq('id', pageId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  if (isLoading) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (!navItem) {
    return <PortalLayout><div>Page not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><Link to="/">Dashboard</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{navItem.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-grow">
          <EmbedRenderer content={navItem.url} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default CustomPage;