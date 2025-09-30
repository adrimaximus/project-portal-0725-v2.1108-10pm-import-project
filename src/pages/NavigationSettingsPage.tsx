import React, { useState, useMemo, useEffect, useRef } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Loader2, Edit, Folder as FolderIcon, FolderPlus, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, useDroppable, DragStartEvent } from '@dnd-kit/core';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  type: 'url_embed' | 'multi_embed';
  slug?: string;
}

export interface NavFolder extends FolderData {
  id: string;
  position: number;
  user_id?: string;
}

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const SortableNavItemRow = ({ item, onDelete, isDeleting, onToggle, onEdit }: { item: NavItem, onDelete: (id: string) => void, isDeleting: boolean, onToggle: (id: string, enabled: boolean) => void, onEdit: (item: NavItem) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item', item } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 0, position: 'relative' as 'relative' };
    const canEdit = item.is_editable ?? true;
    const canDelete = item.is_deletable ?? true;

    const displayUrl = useMemo(() => {
      if (item.type === 'multi_embed') return `/multipage/${item.slug}`;
      if (item.url.startsWith('/')) return item.url;
      return `/custom/${item.slug}`;
    }, [item]);

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md bg-background">
            <div className="flex items-center gap-2 truncate">
                <button {...attributes} {...listeners} className="cursor-grab p-1"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
                <div className="truncate">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{displayUrl}</p>
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

const SortableFolderItem = ({ folder, children, onEdit, onDelete }: { folder: NavFolder, children: React.ReactNode, onEdit: (folder: NavFolder) => void, onDelete: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder.id, data: { type: 'folder', folder } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 0, position: 'relative' as 'relative' };
    const { setNodeRef: setDroppableNodeRef } = useDroppable({ id: folder.id, data: { type: 'folder' } });
    const FolderIconComponent = folder.icon && Icons[folder.icon] ? Icons[folder.icon] : FolderIcon;

    return (
        <div ref={setNodeRef} style={style}>
            <Collapsible defaultOpen>
                <div ref={setDroppableNodeRef} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 font-semibold">
                        <button {...attributes} {...listeners} className="cursor-grab p-1"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
                        <FolderIconComponent className="h-5 w-5" style={{ color: folder.color }} />
                        <CollapsibleTrigger className="flex items-center gap-2">
                            {folder.name}
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </div>
                <CollapsibleContent className="p-2 pl-6 border-l-2 ml-4">
                    {children}
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

const NavigationSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemIcon, setNewItemIcon] = useState<string | undefined>(undefined);
  const [newItemType, setNewItemType] = useState<'url_embed' | 'multi_embed'>('url_embed');
  const [newItemFolderId, setNewItemFolderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<NavFolder | null>(null);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [activeDragData, setActiveDragData] = useState<{ type: string, item?: NavItem, folder?: NavFolder } | null>(null);
  const backfillAttempted = useRef(false);

  const [navItemsState, setNavItemsState] = useState<NavItem[]>([]);
  const [foldersState, setFoldersState] = useState<NavFolder[]>([]);

  const queryKey = ['user_navigation_items', user?.id];
  const foldersQueryKey = ['navigation_folders', user?.id];

  const { data: navItemsData, isLoading: isLoadingItems } = useQuery({ queryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.rpc('get_user_navigation_items'); if (error) throw error; return data as NavItem[]; }, enabled: !!user });
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({ queryKey: foldersQueryKey, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data as NavFolder[]; }, enabled: !!user });

  useEffect(() => { if (navItemsData) setNavItemsState(navItemsData) }, [navItemsData]);
  useEffect(() => { if (foldersData) setFoldersState(foldersData) }, [foldersData]);

  const { mutate: updateItems } = useMutation({ mutationFn: async (items: Partial<NavItem>[]) => { const { error } = await supabase.from('user_navigation_items').upsert(items); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey }), onError: (e: any) => toast.error("Failed to save changes", { description: e.message }) });
  const { mutate: updateFolders } = useMutation({ mutationFn: async (folders: Partial<NavFolder>[]) => { const { error } = await supabase.from('navigation_folders').upsert(folders); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: foldersQueryKey }), onError: (e: any) => toast.error("Failed to reorder folders", { description: e.message }) });
  const { mutate: backfillNavItems } = useMutation({ mutationFn: async () => { if (!user) return; const itemsToInsert = defaultNavItems.map((item, index) => ({ user_id: user.id, name: item.name, url: item.url, icon: item.icon, position: index, is_enabled: true, is_deletable: false, is_editable: false, type: 'url_embed' as const, folder_id: null, })); const { error } = await supabase.from('user_navigation_items').insert(itemsToInsert); if (error) throw error; }, onSuccess: () => { toast.success("Default navigation items have been set up."); queryClient.invalidateQueries({ queryKey }); queryClient.invalidateQueries({ queryKey: foldersQueryKey }); }, onError: (e: any) => toast.error("Failed to set up default navigation.", { description: e.message }) });
  const { mutate: upsertFolder, isPending: isSavingFolder } = useMutation({ mutationFn: async (folder: Partial<NavFolder>) => { const { error } = await supabase.from('navigation_folders').upsert(folder); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: foldersQueryKey }) });
  const { mutate: deleteItem, isPending: isDeletingItem } = useMutation({ mutationFn: async (id: string) => { setDeletingId(id); const { error } = await supabase.from('user_navigation_items').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Page removed"); queryClient.invalidateQueries({ queryKey }); }, onError: (e: any) => toast.error(e.message), onSettled: () => setDeletingId(null) });
  const { mutate: deleteFolder } = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('navigation_folders').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Folder removed"); queryClient.invalidateQueries({ queryKey: foldersQueryKey }); } });
  const addItemMutation = useMutation({
    mutationFn: async ({ name, url, icon, type, folder_id }: { name: string, url: string, icon?: string, type: 'url_embed' | 'multi_embed', folder_id: string | null }) => {
      if (!user) throw new Error("User not authenticated");
      const newPosition = navItemsState.length > 0 ? Math.max(...navItemsState.map(i => i.position)) + 1 : 0;
      const itemToInsert = {
        name,
        url: (type === 'multi_embed' ? '/multipage/placeholder' : url) || '',
        user_id: user.id,
        position: newPosition,
        is_enabled: true,
        icon,
        is_deletable: true,
        is_editable: true,
        type,
        folder_id,
      };
      const { error } = await supabase.from('user_navigation_items').insert(itemToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewItemName("");
      setNewItemContent("");
      setNewItemIcon(undefined);
      setNewItemType('url_embed');
      setNewItemFolderId(null);
      toast.success("Navigation page added");
    },
    onError: (error) => {
      toast.error("Failed to add page", { description: error.message });
    }
  });

  useEffect(() => { if (user && !isLoadingItems && !backfillAttempted.current) { const hasDefaultItems = navItemsData?.some(item => item.is_deletable === false); if (!hasDefaultItems) { backfillAttempted.current = true; backfillNavItems(); } else { backfillAttempted.current = true; } } }, [user, navItemsData, isLoadingItems, backfillNavItems]);

  const handleAddItem = async () => { if (!user) return; const finalName = newItemName.trim() || 'Untitled Page'; const isUrlEmbedValid = newItemType === 'url_embed' && newItemContent.trim(); const isMultiEmbedValid = newItemType === 'multi_embed'; if (isUrlEmbedValid || isMultiEmbedValid) { addItemMutation.mutate({ name: finalName, url: newItemContent.trim(), icon: newItemIcon, type: newItemType, folder_id: newItemFolderId, }); } else { toast.error("Please provide a URL or embed code for this page type."); } };
  const handleSaveEdit = async (id: string, name: string, url: string, icon?: string) => { const item = navItemsState.find(i => i.id === id); if (!item) return; if (item.type === 'multi_embed') { await updateItems([{ id, name, icon }]); } else { await updateItems([{ id, name, url, icon }]); } setEditingItem(null); };
  const handleSaveFolder = (data: FolderData) => { const position = editingFolder ? editingFolder.position : foldersState.length; upsertFolder({ id: editingFolder?.id, ...data, user_id: user!.id, position }, { onSuccess: () => setIsFolderFormOpen(false) }); };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragStart = (event: DragStartEvent) => setActiveDragData(event.active.data.current as any);
  
  const updateAllItemPositions = (items: NavItem[], folders: NavFolder[]) => {
    const finalOrderedItems: NavItem[] = [];
    const itemsByFolder: Record<string, NavItem[]> = { 'uncategorized-folder': [] };
    folders.forEach(f => itemsByFolder[f.id] = []);

    items.forEach(item => {
        const folderId = item.folder_id || 'uncategorized-folder';
        if (itemsByFolder[folderId]) {
            itemsByFolder[folderId].push(item);
        } else {
            itemsByFolder['uncategorized-folder'].push(item);
        }
    });

    const folderOrder = ['uncategorized-folder', ...folders.map(f => f.id)];
    folderOrder.forEach(folderId => {
        finalOrderedItems.push(...(itemsByFolder[folderId] || []));
    });

    const itemUpdates = finalOrderedItems.map((item, index) => ({
        id: item.id,
        position: index,
        folder_id: item.folder_id,
    }));

    updateItems(itemUpdates);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;

    if (activeType === 'folder') {
        const overType = over.data.current?.type;
        if (overType !== 'folder') return;
        
        setFoldersState((folders) => {
            const oldIndex = folders.findIndex(f => f.id === activeId);
            const newIndex = folders.findIndex(f => f.id === overId);
            const reordered = arrayMove(folders, oldIndex, newIndex);
            updateFolders(reordered.map((f, i) => ({ id: f.id, position: i })));
            return reordered;
        });
        return;
    }

    if (activeType === 'item') {
        setNavItemsState(items => {
            const oldIndex = items.findIndex(i => i.id === activeId);
            const overIsFolder = over.data.current?.type === 'folder';
            const newFolderId = overIsFolder ? overId : over.data.current?.sortable.containerId;

            let newItems = [...items];
            const [movedItem] = newItems.splice(oldIndex, 1);
            movedItem.folder_id = newFolderId === 'uncategorized-folder' ? null : newFolderId;

            if (overIsFolder) {
                const itemsInDest = newItems.filter(i => (i.folder_id || 'uncategorized-folder') === newFolderId);
                if (itemsInDest.length > 0) {
                    const lastItemIndex = newItems.findIndex(i => i.id === itemsInDest[itemsInDest.length - 1].id);
                    newItems.splice(lastItemIndex + 1, 0, movedItem);
                } else {
                    newItems.push(movedItem);
                }
            } else {
                const newIndex = newItems.findIndex(i => i.id === overId);
                if (newIndex !== -1) {
                    newItems.splice(newIndex, 0, movedItem);
                } else {
                    newItems.push(movedItem);
                }
            }
            
            updateAllItemPositions(newItems, foldersState);
            return newItems;
        });
    }
  };

  const itemsWithoutFolder = useMemo(() => navItemsState.filter(item => !item.folder_id).sort((a, b) => a.position - b.position), [navItemsState]);
  const { setNodeRef: setUncategorizedNodeRef } = useDroppable({ id: 'uncategorized-folder', data: { type: 'folder' } });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><Link to="/settings">Settings</Link></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Navigation</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        <div><h1 className="text-2xl font-bold tracking-tight">Customize Navigation</h1><p className="text-muted-foreground">Add or remove custom pages from your sidebar.</p></div>
        
        <Card>
          <CardHeader><CardTitle>Navigation Items</CardTitle><CardDescription>Drag and drop to reorder items or move them into folders.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={foldersState.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {foldersState.map(folder => (
                    <SortableFolderItem key={folder.id} folder={folder} onEdit={(f) => { setEditingFolder(f); setIsFolderFormOpen(true); }} onDelete={deleteFolder}>
                      <SortableContext id={folder.id} items={navItemsState.filter(i => i.folder_id === folder.id).map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {navItemsState.filter(i => i.folder_id === folder.id).sort((a, b) => a.position - b.position).map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItems([{ id, is_enabled }])} onEdit={setEditingItem} />)}
                        </div>
                      </SortableContext>
                    </SortableFolderItem>
                  ))}
                </div>
              </SortableContext>
              <div ref={setUncategorizedNodeRef} className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">Uncategorized</h3>
                <SortableContext id="uncategorized-folder" items={itemsWithoutFolder.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {itemsWithoutFolder.map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItems([{ id, is_enabled }])} onEdit={setEditingItem} />)}
                  </div>
                </SortableContext>
              </div>
              <DragOverlay>
                {activeDragData?.type === 'item' && activeDragData.item ? <SortableNavItemRow item={activeDragData.item} onDelete={() => {}} isDeleting={false} onToggle={() => {}} onEdit={() => {}} /> : null}
                {activeDragData?.type === 'folder' && activeDragData.folder ? <SortableFolderItem folder={activeDragData.folder} onEdit={() => {}} onDelete={() => {}}><div></div></SortableFolderItem> : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add New Custom Page</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="type">Page Type</Label><Select value={newItemType} onValueChange={(value: 'url_embed' | 'multi_embed') => setNewItemType(value)}><SelectTrigger><SelectValue placeholder="Select page type" /></SelectTrigger><SelectContent><SelectItem value="url_embed">URL / Embed Code</SelectItem><SelectItem value="multi_embed">Multi Embed Collection</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">{newItemType === 'url_embed' ? 'Single URL or embed code that will be displayed in an iframe' : 'A collection page where you can add multiple embed items'}</p></div>
            <div className="grid gap-2"><Label htmlFor="icon">Icon</Label><IconPicker value={newItemIcon} onChange={setNewItemIcon} /></div>
            <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" /></div>
            {newItemType === 'url_embed' && (<div className="grid gap-2"><Label htmlFor="url">URL or Embed Code</Label><Textarea id="url" value={newItemContent} onChange={(e) => setNewItemContent(e.target.value)} placeholder="https://example.com or <iframe ...></iframe>" /></div>)}
            {newItemType === 'multi_embed' && (<div className="p-3 bg-muted/50 rounded-md"><p className="text-sm text-muted-foreground">This will create a collection page where you can add multiple embed items. The URL will be automatically generated based on the page name.</p></div>)}
            <div className="grid gap-2"><Label htmlFor="folder">Folder</Label><Select value={newItemFolderId || 'uncategorized'} onValueChange={(value) => setNewItemFolderId(value === 'uncategorized' ? null : value)}><SelectTrigger id="folder"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uncategorized">Uncategorized</SelectItem>{foldersState.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}</SelectContent></Select></div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleAddItem} disabled={(newItemType === 'url_embed' && !newItemContent.trim()) || addItemMutation.isPending}>{addItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add Page</Button>
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