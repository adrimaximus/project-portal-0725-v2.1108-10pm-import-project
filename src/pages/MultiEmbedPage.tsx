import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import MultiEmbedCard, { MultiEmbedItem } from '@/components/MultiEmbedCard';
import MultiEmbedItemFormDialog from '@/components/MultiEmbedItemFormDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const MultiEmbedPage = () => {
  const { navItemId } = useParams<{ navItemId: string }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MultiEmbedItem | null>(null);

  const { data: navItem, isLoading: isLoadingNavItem } = useQuery({
    queryKey: ['user_navigation_item', navItemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_navigation_items').select('name').eq('id', navItemId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!navItemId,
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['multi_embed_items', navItemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('multi_embed_items').select('*').eq('nav_item_id', navItemId!);
      if (error) throw error;
      return data as MultiEmbedItem[];
    },
    enabled: !!navItemId,
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('multi_embed_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['multi_embed_items', navItemId] });
    },
    onError: (error: any) => {
      toast.error('Failed to delete item', { description: error.message });
    }
  });

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [items, searchQuery]);

  const handleEdit = (item: MultiEmbedItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  if (isLoadingNavItem || isLoadingItems) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><Link to="/">Dashboard</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{navItem?.name || 'Custom Page'}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">{navItem?.name}</h1>
          <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Add New</Button>
        </div>

        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map(item => (
            <MultiEmbedCard key={item.id} item={item} onEdit={handleEdit} onDelete={deleteItem} />
          ))}
        </div>
      </div>
      <MultiEmbedItemFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} item={editingItem} navItemId={navItemId!} />
    </PortalLayout>
  );
};

export default MultiEmbedPage;