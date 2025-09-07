import React, { useState, useMemo } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Loader2, Edit, Folder as FolderIcon, FolderPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import EditNavItemDialog from "@/components/settings/EditNavItemDialog";
import IconPicker from "@/components/IconPicker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FolderFormDialog, { FolderData } from "@/components/settings/FolderFormDialog";

export interface NavItem {
  id: string;
  name: string;
  url: string;
  position: number;
  user_id: string;
  is_enabled: boolean;
  icon: string | null;
  folder_id: string | null;
}

export interface NavFolder extends FolderData {
  id: string;
  position: number;
  user_id?: string;
}

const SortableNavItemRow = ({ item, onDelete, isDeleting, onToggle, onEdit }: { item: NavItem, onDelete: (id: string) => void, isDeleting: boolean, onToggle: (id: string, enabled: boolean) => void, onEdit: (item: NavItem) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item' } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 0, position: 'relative' as 'relative' };
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
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
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
  const [editingFolder, setEditingFolder] = useState<NavFolder | null>(null);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const queryKey = ['user_navigation_items', user?.id];
  const foldersQueryKey = ['navigation_folders', user?.id];

  const { data: navItems = [], isLoading: isLoadingItems } = useQuery({ queryKey: queryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('user_navigation_items').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data; }, enabled: !!user });
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({ queryKey: foldersQueryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data; }, enabled: !!user });

  const { mutate: upsertItem } = useMutation({ mutationFn: async (item: Partial<NavItem>) => { const { error } = await supabase.from('user_navigation_items').upsert(item); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user?.id] }) });
  const { mutate: upsertFolder, isPending: isSavingFolder } = useMutation({ mutationFn: async (folder: Partial<NavFolder>) => { const { error } = await supabase.from('navigation_folders').upsert(folder); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['navigation_folders', user?.id] }) });
  const { mutate: deleteItem, isPending: isDeletingItem } = useMutation({ mutationFn: async (id: string) => { setDeletingId(id); const { error } = await supabase.from('user_navigation_items').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Item removed"); queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user?.id] }); }, onError: (e: any) => toast.error(e.message), onSettled: () => setDeletingId(null) });
  const { mutate: deleteFolder } = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('navigation_folders').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Folder removed"); queryClient.invalidateQueries({ queryKey: ['navigation_folders', user?.id] }); } });

  const addItemMutation = useMutation({
    mutationFn: async ({ name, url, icon }: { name: string, url: string, icon?: string }) => {
      if (!user) throw new Error("User not authenticated");
      const newPosition = navItems.filter(i => !i.folder_id).length;
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

  const handleAddItem = () => {
    if (newItemName.trim() && newItemUrl.trim()) {
      try {
        new URL(newItemUrl);
        addItemMutation.mutate({ name: newItemName.trim(), url: newItemUrl.trim(), icon: newItemIcon });
      } catch (_) { toast.error("Invalid URL format."); }
    }
  };

  const handleSaveEdit = async (id: string, name: string, url: string, icon?: string) => {
    try { new URL(url); await upsertItem({ id, name, url, icon }); setEditingItem(null); } catch (_) { toast.error("Invalid URL format."); }
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
    const overIsFolder = over.data.current?.type === 'folder';
    const overFolderId = overIsFolder ? overId : over.data.current?.sortable.containerId;

    const activeItem = navItems.find(i => i.id === activeId);
    if (!activeItem) return;

    const oldFolderId = activeItem.folder_id;
    const newFolderId = overFolderId === 'root' ? null : overFolderId;

    if (oldFolderId === newFolderId) { // Reordering within the same container
      const itemsInContainer = navItems.filter(i => i.folder_id === oldFolderId).sort((a, b) => a.position - b.position);
      const oldIndex = itemsInContainer.findIndex(i => i.id === activeId);
      const newIndex = itemsInContainer.findIndex(i => i.id === overId);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(itemsInContainer, oldIndex, newIndex);
        reordered.forEach((item, index) => upsertItem({ id: item.id, position: index }));
      }
    } else { // Moving to a new container
      const itemsInNewContainer = navItems.filter(i => i.folder_id === newFolderId);
      upsertItem({ id: activeId, folder_id: newFolderId, position: itemsInNewContainer.length });
    }
  };

  const itemsWithoutFolder = useMemo(() => navItems.filter(item => !item.folder_id), [navItems]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><Link to="/settings">Settings</Link></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Navigation</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        <div><h1 className="text-2xl font-bold tracking-tight">Customize Navigation</h1><p className="text-muted-foreground">Add or remove custom pages from your sidebar.</p></div>
        
        <Card>
          <CardHeader><CardTitle>Custom Navigation Items</CardTitle><CardDescription>Drag and drop to reorder items or move them into folders.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="space-y-2">
                {folders.map(folder => (
                  <Collapsible key={folder.id} defaultOpen>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 font-semibold"><FolderIcon className="h-5 w-5" style={{ color: folder.color }} /> {folder.name}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setIsFolderFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-2 pl-6 border-l-2 ml-4">
                      <SortableContext id={folder.id} items={navItems.filter(i => i.folder_id === folder.id).map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {navItems.filter(i => i.folder_id === folder.id).map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => upsertItem({ id, is_enabled })} onEdit={setEditingItem} />)}
                        </div>
                      </SortableContext>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Top-Level Items</h3>
                <SortableContext id="root" items={itemsWithoutFolder.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {itemsWithoutFolder.map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => upsertItem({ id, is_enabled })} onEdit={setEditingItem} />)}
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
          <CardHeader><CardTitle>Add New Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="icon">Icon</Label><IconPicker value={newItemIcon} onChange={setNewItemIcon} /></div>
            <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" /></div>
            <div className="grid gap-2"><Label htmlFor="url">URL</Label><Input id="url" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://example.com/dashboard" /></div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !newItemUrl.trim() || addItemMutation.isPending}>{addItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add Item</Button>
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