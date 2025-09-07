import React, { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Loader2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import EditNavItemDialog from "@/components/settings/EditNavItemDialog";
import IconPicker from "@/components/IconPicker";

export interface NavItem {
  id: string;
  name: string;
  url: string;
  position: number;
  user_id: string;
  is_enabled: boolean;
  icon: string | null;
}

const SortableNavItemRow = ({ item, onDelete, isDeleting, onToggle, onEdit }: { item: NavItem, onDelete: (id: string) => void, isDeleting: boolean, onToggle: (id: string, enabled: boolean) => void, onEdit: (item: NavItem) => void }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 10 : 0,
      position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md bg-background">
            <div className="flex items-center gap-2 truncate">
                <button {...attributes} {...listeners} className="cursor-grab p-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="truncate">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
                <Switch
                    checked={item.is_enabled}
                    onCheckedChange={(checked) => onToggle(item.id, checked)}
                    aria-label="Toggle navigation item"
                />
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}

const NavigationSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemIcon, setNewItemIcon] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);

  const queryKey = ['user_navigation_items', user?.id];

  const { data: navItems = [], isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_navigation_items')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ name, url, icon }: { name: string, url: string, icon?: string }) => {
      if (!user) throw new Error("User not authenticated");
      const newPosition = navItems.length;
      const { data, error } = await supabase
        .from('user_navigation_items')
        .insert({ name, url, user_id: user.id, position: newPosition, is_enabled: true, icon })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData(queryKey, (old: NavItem[] | undefined) => [...(old || []), newItem]);
      setNewItemName("");
      setNewItemUrl("");
      setNewItemIcon(undefined);
      toast.success("Navigation item added");
    },
    onError: (error) => {
      toast.error("Failed to add item", { description: error.message });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase.from('user_navigation_items').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(queryKey, (old: NavItem[] | undefined) => old?.filter(item => item.id !== deletedId) || []);
      toast.success("Navigation item removed");
    },
    onError: (error) => {
      toast.error("Failed to remove item", { description: error.message });
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async (updatedFields: Partial<NavItem> & { id: string }) => {
        const { id, ...fieldsToUpdate } = updatedFields;
        const { data, error } = await supabase
            .from('user_navigation_items')
            .update(fieldsToUpdate)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    onSuccess: (updatedItem) => {
        queryClient.setQueryData(queryKey, (old: NavItem[] | undefined) =>
            old?.map(item => item.id === updatedItem.id ? updatedItem : item) || []
        );
        toast.success("Item updated");
        if (editingItem?.id === updatedItem.id) {
          setEditingItem(null);
        }
    },
    onError: (error) => {
        toast.error("Failed to update item", { description: error.message });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderedItems: NavItem[]) => {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        position: index,
      }));
      const { error } = await supabase.from('user_navigation_items').upsert(updates);
      if (error) throw error;
    },
    onMutate: async (orderedItems: NavItem[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, orderedItems);
      return { previousItems };
    },
    onError: (err, newItems, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      toast.error("Failed to reorder items", { description: err.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleAddItem = () => {
    if (newItemName.trim() && newItemUrl.trim()) {
      try {
        new URL(newItemUrl);
        addItemMutation.mutate({ name: newItemName.trim(), url: newItemUrl.trim(), icon: newItemIcon });
      } catch (_) {
        toast.error("Invalid URL format.");
        return;
      }
    }
  };

  const handleSaveEdit = async (id: string, name: string, url: string, icon?: string) => {
    try {
        new URL(url);
        await updateItemMutation.mutateAsync({ id, name, url, icon });
    } catch (_) {
        toast.error("Invalid URL format.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = navItems.findIndex(item => item.id === active.id);
      const newIndex = navItems.findIndex(item => item.id === over.id);
      const newOrder = arrayMove(navItems, oldIndex, newIndex);
      updateOrderMutation.mutate(newOrder);
    }
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Navigation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Customize Navigation
          </h1>
          <p className="text-muted-foreground">
            Add or remove custom pages from your sidebar. The sidebar will update on the next page refresh.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Custom Navigation Items</CardTitle>
            <CardDescription>Drag and drop to reorder items. Use the toggle to show or hide them in the sidebar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : navItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No custom items yet.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={navItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {navItems.map((item) => (
                          <SortableNavItemRow 
                            key={item.id} 
                            item={item} 
                            onDelete={deleteItemMutation.mutate}
                            isDeleting={deleteItemMutation.isPending && deletingId === item.id}
                            onToggle={(id, is_enabled) => updateItemMutation.mutate({ id, is_enabled })}
                            onEdit={setEditingItem}
                          />
                      ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon</Label>
              <IconPicker value={newItemIcon} onChange={setNewItemIcon} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://example.com/dashboard" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !newItemUrl.trim() || addItemMutation.isPending}>
                {addItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Item
            </Button>
          </CardFooter>
        </Card>
      </div>
      <EditNavItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveEdit}
        isSaving={updateItemMutation.isPending && !!editingItem}
      />
    </PortalLayout>
  );
};

export default NavigationSettingsPage;