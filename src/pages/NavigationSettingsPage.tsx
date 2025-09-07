import React, { useState, useMemo, useEffect, useRef } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Loader2, Edit, Folder as FolderIcon, FolderPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import EditNavItemDialog from "@/components/settings/EditNavItemDialog";
import IconPicker from "@/components/IconPicker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FolderFormDialog, { FolderData } from "@/components/settings/FolderFormDialog";
import { Textarea } from "@/components/ui/textarea";
import { defaultNavItems } from "@/lib/defaultNavItems";

export interface NavItem {
  id: string;
  name: string;
  url: string;
  position: number;
  user_id: string;
  is_enabled: boolean;
  icon: string | null;
  folder_id: string | null;
  is_deletable?: boolean;
  is_editable?: boolean;
}

export interface NavFolder extends FolderData {
  id: string;
  position: number;
  user_id?: string;
}

const SortableNavItemRow = ({ item, onDelete, isDeleting, onToggle, onEdit }: { item: NavItem, onDelete: (id: string) => void, isDeleting: boolean, onToggle: (id: string, enabled: boolean) => void, onEdit: (item: NavItem) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item', item } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 0, position: 'relative' as 'relative' };
    const canEdit = item.is_editable ?? true;
    const canDelete = item.is_deletable ?? true;

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md bg-background">
            <div className="flex items-center gap-2 truncate">
                <button {...attributes} {...listeners} className="cursor-grab p-1"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
                <div className="truncate">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
                <Switch checked={item.is_enabled} onCheckedChange={(checked) => onToggle(item.id, checked)} />
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)} disabled={!canEdit}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} disabled={isDeleting || !canDelete}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
            </div>
        </div>
    )
}

const DroppableFolder = ({ folder, children, onEdit, onDelete }: { folder: NavFolder, children: React.ReactNode, onEdit: (folder: NavFolder) => void, onDelete: (id: string) => void }) => {
    const { setNodeRef } = useDroppable({ id: folder.id, data: { type: 'folder' } });

    return (
        <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
                <div ref={setNodeRef} className="flex items-center justify-between p-2 border rounded-md bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2 font-semibold"><FolderIcon className="h-5 w-5" style={{ color: folder.color }} /> {folder.name}</div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2 pl-6 border-l-2 ml-4">
                {children}
            </CollapsibleContent>
        </Collapsible>
    )
}

const NavigationSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemIcon, setNewItemIcon] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<NavFolder | null>(null);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const backfillAttempted = useRef(false);

  const queryKey = ['user_navigation_items', user?.id];
  const foldersQueryKey = ['navigation_folders', user?.id];

  const { data: navItems = [], isLoading: isLoadingItems } = useQuery({ queryKey: queryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('user_navigation_items').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data; }, enabled: !!user });
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({ queryKey: foldersQueryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data; }, enabled: !!user });

  const { mutate: updateItems } = useMutation({
    mutationFn: async (items: Partial<NavItem>[]) => {
      const promises = items.map(item => {
        const { id, ...updateData } = item;
        if (!id) return Promise.resolve({ error: null });
        return supabase.from('user_navigation_items').update(updateData).eq('id', id);
      });
      const results = await Promise.all(promises);
      const firstError = results.find(res => res.error);
      if (firstError) throw firstError.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to save changes", { description: error.message });
    }
  });

  const { mutate: backfillNavItems } = useMutation({
    mutationFn: async () => {
        if (!user) return;
        const itemsToInsert = defaultNavItems.map((item, index) => ({
            user_id: user.id,
            name: item.name,
            url: item.url,
            icon: item.icon,
            position: index,
            is_enabled: true,
            is_deletable: false,
            is_editable: false,
        }));
        const { error } = await supabase.from('user_navigation_items').insert(itemsToInsert);
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success("Default navigation items have been set up.");
        queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
        toast.error("Failed to set up default navigation.", { description: error.message });
    }
  });

  useEffect(() => {
    if (user && !isLoadingItems && !backfillAttempted.current) {
        const hasDefaultItems = navItems.some(item => item.is_deletable === false);
        if (!hasDefaultItems) {
            backfillAttempted.current = true;
            backfillNavItems();
        } else {
            backfillAttempted.current = true;
        }
    }
  }, [user, navItems, isLoadingItems, backfillNavItems]);

  const { mutate: upsertFolder, isPending: isSavingFolder } = useMutation({ mutationFn: async (folder: Partial<NavFolder>) => { const { error } = await supabase.from('navigation_folders').upsert(folder); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['navigation_folders', user?.id] }) });
  const { mutate: deleteItem, isPending: isDeletingItem } = useMutation({ mutationFn: async (id: string) => { setDeletingId(id); const { error } = await supabase.from('user_navigation_items').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Item removed"); queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user?.id] }); }, onError: (e: any) => toast.error(e.message), onSettled: () => setDeletingId(null) });
  const { mutate: deleteFolder } = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('navigation_folders').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Folder removed"); queryClient.invalidateQueries({ queryKey: ['navigation_folders', user?.id] }); } });

  const addItemMutation = useMutation({
    mutationFn: async ({ name, url, icon }: { name: string, url: string, icon?: string }) => {
      if (!user) throw new Error("User not authenticated");
      const newPosition = navItems.filter(i => !i.folder_id).length;
      const { data, error } = await supabase
        .from('user_navigation_items')
        .insert({ name, url, user_id: user.id, position: newPosition, is_enabled: true, icon, is_deletable: true, is_editable: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData(queryKey, (old: NavItem[] | undefined) => [...(old || []), newItem]);
      setNewItemName("");
      setNewItemContent("");
      setNewItemIcon(undefined);
      toast.success("Navigation item added");
    },
    onError: (error) => {
      toast.error("Failed to add item", { description: error.message });
    }
  });

  const handleAddItem = () => {
    if (newItemName.trim() && newItemContent.trim()) {
      addItemMutation.mutate({ name: newItemName.trim(), url: newItemContent.trim(), icon: newItemIcon });
    }
  };

  const handleSaveEdit = async (id: string, name: string, url: string, icon?: string) => {
    await updateItems([{ id, name, url, icon }]);
    setEditingItem(null);
  };

  const handleSaveFolder = (data: FolderData) => {
    const position = editingFolder ? editingFolder.position : folders.length;
    upsertFolder({ id: editingFolder?.id, ...data, user_id: user!.id, position }, { onSuccess: () => setIsFolderFormOpen(false) });
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragStart = (event: DragEndEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeItem = navItems.find(i => i.id === activeId);
    if (!activeItem) return;

    const oldFolderId = activeItem.folder_id;
    const overIsFolder = over.data.current?.type === 'folder';
    const overItem = navItems.find(i => i.id === overId);
    const newFolderId = overIsFolder ? overId : (overItem ? overItem.folder_id : null);

    const itemsToUpdate: Partial<NavItem>[] = [];

    queryClient.setQueryData(queryKey, (currentItems: NavItem[] = []) => {
      let newItems = [...currentItems];
      const activeIndex = newItems.findIndex(i => i.id === activeId);
      
      if (oldFolderId === newFolderId) {
        const itemsInList = newItems.filter(i => i.folder_id === oldFolderId).sort((a, b) => a.position - b.position);
        const oldListIndex = itemsInList.findIndex(i => i.id === activeId);
        const newListIndex = itemsInList.findIndex(i => i.id === overId);
        if (oldListIndex === -1 || newListIndex === -1) return currentItems;
        
        const reordered = arrayMove(itemsInList, oldListIndex, newListIndex);
        reordered.forEach((item, index) => {
          const originalItem = newItems.find(i => i.id === item.id)!;
          originalItem.position = index;
          itemsToUpdate.push({ id: item.id, position: index });
        });
      } else {
        const movedItem = newItems[activeIndex];
        movedItem.folder_id = newFolderId;

        const itemsInNewList = newItems.filter(i => i.folder_id === newFolderId && i.id !== activeId).sort((a, b) => a.position - b.position);
        const overIndexInNewList = overItem ? itemsInNewList.findIndex(i => i.id === overId) : itemsInNewList.length;
        itemsInNewList.splice(overIndexInNewList, 0, movedItem);
        
        const itemsInOldList = newItems.filter(i => i.folder_id === oldFolderId && i.id !== activeId).sort((a, b) => a.position - b.position);

        itemsInOldList.forEach((item, index) => { item.position = index; itemsToUpdate.push({ id: item.id, position: index }); });
        itemsInNewList.forEach((item, index) => { item.position = index; itemsToUpdate.push({ id: item.id, position: index, folder_id: newFolderId }); });
      }
      return newItems;
    });

    if (itemsToUpdate.length > 0) {
      updateItems(itemsToUpdate);
    }
  };

  const itemsWithoutFolder = useMemo(() => navItems.filter(item => !item.folder_id).sort((a, b) => a.position - b.position), [navItems]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><Link to="/settings">Settings</Link></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Navigation</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        <div><h1 className="text-2xl font-bold tracking-tight">Customize Navigation</h1><p className="text-muted-foreground">Add or remove custom pages from your sidebar.</p></div>
        
        <Card>
          <CardHeader><CardTitle>Navigation Items</CardTitle><CardDescription>Drag and drop to reorder items or move them into folders.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="space-y-2">
                {folders.map(folder => (
                  <DroppableFolder key={folder.id} folder={folder} onEdit={(f) => { setEditingFolder(f); setIsFolderFormOpen(true); }} onDelete={deleteFolder}>
                    <SortableContext id={folder.id} items={navItems.filter(i => i.folder_id === folder.id).map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {navItems.filter(i => i.folder_id === folder.id).sort((a, b) => a.position - b.position).map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItems([{ id, is_enabled }])} onEdit={setEditingItem} />)}
                      </div>
                    </SortableContext>
                  </DroppableFolder>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Top-Level Items</h3>
                <SortableContext id="root" items={itemsWithoutFolder.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {itemsWithoutFolder.map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItems([{ id, is_enabled }])} onEdit={setEditingItem} />)}
                  </div>
                </SortableContext>
              </div>
              <DragOverlay>
                {activeId && navItems.find(i => i.id === activeId) ? <SortableNavItemRow item={navItems.find(i => i.id === activeId)!} onDelete={() => {}} isDeleting={false} onToggle={() => {}} onEdit={() => {}} /> : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add New Custom Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="icon">Icon</Label><IconPicker value={newItemIcon} onChange={setNewItemIcon} /></div>
            <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" /></div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL or Embed Code</Label>
              <Textarea id="url" value={newItemContent} onChange={(e) => setNewItemContent(e.target.value)} placeholder="https://example.com or <iframe ...></iframe>" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !newItemContent.trim() || addItemMutation.isPending}>{addItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add Item</Button>
            <Button variant="outline" onClick={() => { setEditingFolder(null); setIsFolderFormOpen(true); }}><FolderPlus className="mr-2 h-4 w-4" /> Add Folder</Button>
          </CardFooter>
        </Card>
      </div>
      <EditNavItemDialog item={editingItem} open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} onSave={handleSaveEdit} isSaving={false} />
      <FolderFormDialog open={isFolderFormOpen} onOpenChange={setIsFolderFormOpen} onSave={handleSaveFolder} folder={editingFolder} isSaving={isSavingFolder} />
    </PortalLayout>
  );
};

export default NavigationSettingsPage;