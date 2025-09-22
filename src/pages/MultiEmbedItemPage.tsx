import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Loader2, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import EmbedRenderer from '@/components/EmbedRenderer';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import MultiEmbedItemFormDialog from '@/components/MultiEmbedItemFormDialog';
import { toast } from 'sonner';
import { MultiEmbedItem } from '@/components/MultiEmbedCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MultiEmbedItemPage = () => {
  const { slug, itemId } = useParams<{ slug: string; itemId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: navItem, isLoading: isLoadingNavItem } = useQuery({
    queryKey: ['user_navigation_item', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_navigation_items').select('name, url').eq('slug', slug!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['multi_embed_item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('multi_embed_items').select('*').eq('id', itemId!).single();
      if (error) throw error;
      return data as MultiEmbedItem;
    },
    enabled: !!itemId,
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('multi_embed_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['multi_embed_items', item?.nav_item_id] });
      navigate(navItem?.url || `/multipage/${slug}`);
    },
    onError: (error: any) => {
      toast.error('Failed to delete item', { description: error.message });
    }
  });

  const handleDelete = () => {
    if (item) {
      deleteItem(item.id);
    }
    setIsDeleteDialogOpen(false);
  };

  if (isLoadingNavItem || isLoadingItem) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (!item || !navItem) {
    return <PortalLayout><div>Item not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><Link to="/">Dashboard</Link></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><Link to={navItem.url}>{navItem.name}</Link></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{item.title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-grow">
          <EmbedRenderer content={item.embed_content} />
        </div>
      </div>

      <MultiEmbedItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={item}
        navItemId={item.nav_item_id}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item "{item.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default MultiEmbedItemPage;