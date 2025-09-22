import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Loader2 } from 'lucide-react';
import EmbedRenderer from '@/components/EmbedRenderer';

const MultiEmbedItemPage = () => {
  const { navItemId, itemId } = useParams<{ navItemId: string; itemId: string }>();

  const { data: navItem, isLoading: isLoadingNavItem } = useQuery({
    queryKey: ['user_navigation_item', navItemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_navigation_items').select('name, url').eq('id', navItemId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!navItemId,
  });

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['multi_embed_item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('multi_embed_items').select('*').eq('id', itemId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  if (isLoadingNavItem || isLoadingItem) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (!item || !navItem) {
    return <PortalLayout><div>Item not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><Link to="/">Dashboard</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><Link to={navItem.url}>{navItem.name}</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{item.title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-grow">
          <EmbedRenderer content={item.embed_content} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default MultiEmbedItemPage;