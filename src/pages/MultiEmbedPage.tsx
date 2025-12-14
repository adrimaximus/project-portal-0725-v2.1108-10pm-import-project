import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import MultiEmbedCard, { MultiEmbedItem } from '@/components/MultiEmbedCard';
import MultiEmbedItemFormDialog from '@/components/MultiEmbedItemFormDialog';
import { Input } from '@/components/ui/input';
import { NavItem as DbNavItem } from '@/pages/NavigationSettingsPage';

const MultiEmbedPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: navItem, isLoading: isLoadingNavItem } = useQuery({
    queryKey: ['user_navigation_item', slug],
    queryFn: async (): Promise<DbNavItem | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .rpc('get_nav_item_by_slug', { p_slug: slug })
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as DbNavItem | null;
    },
    enabled: !!slug,
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['multi_embed_items', navItem?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('multi_embed_items').select('*').eq('nav_item_id', navItem!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as MultiEmbedItem[];
    },
    enabled: !!navItem?.id,
  });

  const handleAddNew = () => {
    setIsFormOpen(true);
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  if (isLoadingNavItem) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><Link to="/">Dashboard</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{navItem?.name || 'Custom Page'}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Page
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by title, description, or tag..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoadingItems ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <MultiEmbedCard key={item.id} item={item} parentSlug={slug!} />
          ))}
        </div>
      )}

      <MultiEmbedItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={null}
        navItemId={navItem?.id!}
      />
    </PortalLayout>
  );
};

export default MultiEmbedPage;