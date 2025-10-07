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
  type: 'url_embed' | 'multi_embed' | 'googlesheet_embed';
  slug?: string;
}

export interface NavFolder extends FolderData {
  id: string;
  position: number;
  user_id?: string;
}

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const SortableNavItemRow = ({ item, onDelete, isDeleting, onToggle, onEdit, canManage }: { item: NavItem, onDelete: (id: string) => void, isDeleting: boolean, onToggle: (id: string, enabled: boolean) => void, onEdit: (item: NavItem) => void, canManage: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item', item } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 0, position: 'relative' as 'relative' };
    const canEdit = item.is_editable ?? true;
    const canDelete = item.is_deletable ?? true;

    const displayUrl = useMemo(() => {
      if (item.type === 'multi_embed') return `/multipage/${item.slug}`;
      if (item.type === 'googlesheet_embed') return `/gsheet/${item.slug}`;
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
                <Switch checked={item.is_enabled} onCheckedChange={(checked) => onToggle(item.id, checked)} disabled={!canManage} />
                {canManage && (
                    <>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} disabled={!canEdit}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} disabled={isDeleting || !canDelete}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
                    </>
                )}
            </div>
        </div>
    )
}

const SortableFolderItem = ({ folder, children, onEdit, onDelete, canManage }: { folder: NavFolder, children: React.ReactNode, onEdit: (folder: NavFolder) => void, onDelete: (id: string) => void, canManage: boolean }) => {
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
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(folder); }}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )}
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
  const [newItemType, setNewItemType] = useState<'url_embed' | 'multi_embed' | 'googlesheet_embed'>('url_embed');
  const [newItemFolderId, setNewItemFolderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<NavFolder | null>(null);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [activeDragData, setActiveDragData] = useState<{ type: string, item?: NavItem, folder?: NavFolder } | null>(null);
  const backfillAttempted = useRef(false);

  const canManageNavigation = useMemo(() => !!user, [user]);

  const [navItemsState, setNavItemsState] = useState<NavItem[]>([]);
  const [foldersState, setFoldersState] = useState<NavFolder[]>([]);

  const itemsQueryKey = ['user_navigation_items'];
  const foldersQueryKey = ['navigation_folders'];

  const { data: navItemsData, isLoading: isLoadingItems } = useQuery({ queryKey: [...itemsQueryKey, user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.rpc('get_user_navigation_items'); if (error) throw error; return data as NavItem[]; }, enabled: !!user });
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({ queryKey: [...foldersQueryKey, user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); if (error) throw error; return data as NavFolder[]; }, enabled: !!user });

  useEffect(() => { if (navItemsData) setNavItemsState(navItemsData) }, [navItemsData]);
  useEffect(() => { if (foldersData) setFoldersState(foldersData) }, [foldersData]);

  const { mutate: updateItems } = useMutation({
    mutationFn: async (items: Partial<NavItem>[]) => {
      if (items.length === 0) return;
      const { error } = await supabase.from('user_navigation_items').upsert(items);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryKey }),
    onError: (e: any) => toast.error("Failed to save reorder changes", { description: e.message })
  });

  const { mutate: updateItem } = useMutation({
    mutationFn: async (item: Partial<NavItem> & { id: string }) => {
        const { error } = await supabase.from('user_navigation_items').update(item).eq('id', item.id);
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success("Navigation item updated.");
        queryClient.invalidateQueries({ queryKey: itemsQueryKey });
    },
    onError: (e: any) => toast.error("Failed to save changes", { description: e.message })
  });

  const { mutate: updateFolders } = useMutation({ mutationFn: async (folders: Partial<NavFolder>[]) => { if (folders.length === 0) return; const { error } = await supabase.from('navigation_folders').upsert(folders); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: foldersQueryKey }), onError: (e: any) => toast.error("Failed to reorder folders", { description: e.message }) });
  const { mutate: backfillNavItems } = useMutation({ mutationFn: async () => { if (!user) return; const itemsToInsert = defaultNavItems.map((item, index) => ({ user_id: user.id, name: item.name, url: item.url, icon: item.icon, position: index, is_enabled: true, is_deletable: false, is_editable: false, type: 'url_embed' as const, folder_id: null, })); const { error } = await supabase.from('user_navigation_items').insert(itemsToInsert); if (error) throw error; }, onSuccess: () => { toast.success("Default navigation items have been set up."); queryClient.invalidateQueries({ queryKey: itemsQueryKey }); queryClient.invalidateQueries({ queryKey: foldersQueryKey }); }, onError: (e: any) => toast.error("Failed to set up default navigation.", { description: e.message }) });
  const { mutate: upsertFolder, isPending: isSavingFolder } = useMutation({ mutationFn: async (folder: Partial<NavFolder>) => { const { error } = await supabase.from('navigation_folders').upsert(folder); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: foldersQueryKey }) });
  const { mutate: deleteItem, isPending: isDeletingItem } = useMutation({ mutationFn: async (id: string) => { setDeletingId(id); const { error } = await supabase.from('user_navigation_items').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Page removed"); queryClient.invalidateQueries({ queryKey: itemsQueryKey }); }, onError: (e: any) => toast.error(e.message), onSettled: () => setDeletingId(null) });
  const { mutate: deleteFolder } = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('navigation_folders').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success("Folder removed"); queryClient.invalidateQueries({ queryKey: foldersQueryKey }); queryClient.invalidateQueries({ queryKey: itemsQueryKey }); } });
  const addItemMutation = useMutation({
    mutationFn: async ({ name, url, icon, type, folder_id }: { name: string, url: string, icon?: string, type: 'url_embed' | 'multi_embed' | 'googlesheet_embed', folder_id: string | null }) => {
      if (!user) throw new Error("User not authenticated");
      const newPosition = navItemsState.length > 0 ? Math.max(...navItemsState.map(i => i.position)) + 1 : 0;
      const itemToInsert = { name, url: (type === 'multi_embed' ? '/multipage/placeholder' : url) || '', user_id: user.id, position: newPosition, is_enabled: true, icon, is_deletable: true, is_editable: true, type, folder_id, };
      const { error } = await supabase.from('user_navigation_items').insert(itemToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey });
      setNewItemName(""); setNewItemContent(""); setNewItemIcon(undefined); setNewItemType('url_embed'); setNewItemFolderId(null);
      toast.success("Navigation page added");
    },
    onError: (error) => toast.error("Failed to add page", { description: error.message })
  });

  useEffect(() => { if (user && !isLoadingItems && !backfillAttempted.current) { const hasDefaultItems = navItemsData?.some(item => item.is_deletable === false); if (!hasDefaultItems) { backfillAttempted.current = true; backfillNavItems(); } else { backfillAttempted.current = true; } } }, [user, navItemsData, isLoadingItems, backfillNavItems]);

  const handleAddItem = async () => { if (!user) return; const finalName = newItemName.trim() || 'Untitled Page'; const isContentBased = newItemType === 'url_embed' || newItemType === 'googlesheet_embed'; const isContentValid = isContentBased && newItemContent.trim(); const isMultiEmbedValid = newItemType === 'multi_embed'; if (isContentValid || isMultiEmbedValid) { addItemMutation.mutate({ name: finalName, url: newItemContent.trim(), icon: newItemIcon, type: newItemType, folder_id: newItemFolderId, }); } else { toast.error("Please provide a URL or embed code for this page type."); } };
  const handleSaveEdit = (id: string, name: string, url: string, icon?: string) => {
    const item = navItemsState.find(i => i.id === id);
    if (!item) return;

    const payload: Partial<NavItem> & { id: string } = { id, name, icon };
    if (item.type !== 'multi_embed') {
        payload.url = url;
    }

    updateItem(payload, {
        onSuccess: () => {
            setEditingItem(null);
        }
    });
  };
  const handleSaveFolder = (data: FolderData) => { const position = editingFolder ? editingFolder.position : foldersState.length; upsertFolder({ id: editingFolder?.id, ...data, user_id: user!.id, position }, { onSuccess: () => setIsFolderFormOpen(false) }); };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragStart = (event: DragStartEvent) => setActiveDragData(event.active.data.current as any);
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'folder' && overType === 'folder') {
        setFoldersState((folders) => {
            const oldIndex = folders.findIndex((f) => f.id === activeId);
            const newIndex = folders.findIndex((f) => f.id === overId);
            const newOrder = arrayMove(folders, oldIndex, newIndex);
            updateFolders(newOrder.map((f, index) => ({ id: f.id, position: index })));
            return newOrder;
        });
    } else if (activeType === 'item') {
        setNavItemsState((items) => {
            const oldIndex = items.findIndex((i) => i.id === activeId);
            const overIsItem = overType === 'item';
            const newIndex = overIsItem ? items.findIndex((i) => i.id === overId) : -1;

            let newItems = [...items];
            const activeItem = items[oldIndex];
            const newFolderId = overType === 'folder' 
                ? (overId === 'uncategorized-folder' ? null : overId) 
                : (overIsItem ? items.find(i => i.id === overId)?.folder_id : activeItem.folder_id);

            if (overIsItem && newIndex !== -1) {
                newItems = arrayMove(items, oldIndex, newIndex);
                const movedItemIndex = newItems.findIndex(i => i.id === activeId);
                if (newItems[movedItemIndex].folder_id !== newFolderId) {
                    newItems[movedItemIndex] = { ...newItems[movedItemIndex], folder_id: newFolderId };
                }
            } else if (overType === 'folder') {
                const [movedItem] = newItems.splice(oldIndex, 1);
                movedItem.folder_id = newFolderId;
                const itemsInDest = newItems.filter(i => i.folder_id === newFolderId);
                const lastItemInDest = itemsInDest[itemsInDest.length - 1];
                const insertAtIndex = lastItemInDest ? newItems.findIndex(i => i.id === lastItemInDest.id) + 1 : oldIndex;
                newItems.splice(insertAtIndex, 0, movedItem);
            }

            const updates: Partial<NavItem>[] = [];
            const allFolderIds = [null, ...foldersState.map(f => f.id)];
            let currentPosition = 0;
            allFolderIds.forEach(folderId => {
                newItems.filter(i => i.folder_id === folderId).forEach(item => {
                    const originalItem = items.find(i => i.id === item.id);
                    if (!originalItem || originalItem.position !== currentPosition || originalItem.folder_id !== item.folder_id) {
                        updates.push({ id: item.id, position: currentPosition, folder_id: item.folder_id });
                    }
                    currentPosition++;
                });
            });

            if (updates.length > 0) {
                updateItems(updates);
            }
            
            return newItems;
        });
    }
  };

  const itemsWithoutFolder = useMemo(() => navItemsState.filter(item => !item.folder_id), [navItemsState]);
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
                    <SortableFolderItem key={folder.id} folder={folder} onEdit={(f) => { setEditingFolder(f); setIsFolderFormOpen(true); }} onDelete={deleteFolder} canManage={canManageNavigation}>
                      <SortableContext items={navItemsState.filter(i => i.folder_id === folder.id).map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {navItemsState.filter(i => i.folder_id === folder.id).map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItem({ id, is_enabled })} onEdit={setEditingItem} canManage={canManageNavigation} />)}
                        </div>
                      </SortableContext>
                    </SortableFolderItem>
                  ))}
                </div>
              </SortableContext>
              <div ref={setUncategorizedNodeRef} className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">Uncategorized</h3>
                <SortableContext items={itemsWithoutFolder.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {itemsWithoutFolder.map(item => <SortableNavItemRow key={item.id} item={item} onDelete={deleteItem} isDeleting={isDeletingItem && deletingId === item.id} onToggle={(id, is_enabled) => updateItem({ id, is_enabled })} onEdit={setEditingItem} canManage={canManageNavigation} />)}
                  </div>
                </SortableContext>
              </div>
              <DragOverlay>
                {activeDragData?.type === 'item' && activeDragData.item ? <SortableNavItemRow item={activeDragData.item} onDelete={() => {}} isDeleting={false} onToggle={() => {}} onEdit={() => {}} canManage={canManageNavigation} /> : null}
                {activeDragData?.type === 'folder' && activeDragData.folder ? <SortableFolderItem folder={activeDragData.folder} onEdit={() => {}} onDelete={() => {}} canManage={canManageNavigation}><div></div></SortableFolderItem> : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {canManageNavigation && (
          <Card>
            <CardHeader><CardTitle>Add New Custom Page</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Page Type</Label>
                <Select value={newItemType} onValueChange={(value: 'url_embed' | 'multi_embed' | 'googlesheet_embed') => setNewItemType(value)}>
                  <SelectTrigger><SelectValue placeholder="Select page type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url_embed">URL / Embed Code</SelectItem>
                    <SelectItem value="multi_embed">Multi Embed Collection</SelectItem>
                    <SelectItem value="googlesheet_embed">Google Sheet</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newItemType === 'url_embed' ? 'Single URL or embed code that will be displayed in an iframe' : 
                   newItemType === 'multi_embed' ? 'A collection page where you can add multiple embed items' :
                   'Embed a public Google Sheet as an interactive table.'}
                </p>
              </div>
              <div className="grid gap-2"><Label htmlFor="icon">Icon</Label><IconPicker value={newItemIcon} onChange={setNewItemIcon} /></div>
              <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" /></div>
              {(newItemType === 'url_embed' || newItemType === 'googlesheet_embed') && (
                <div className="grid gap-2">
                  <Label htmlFor="url">{newItemType === 'googlesheet_embed' ? 'Public Google Sheet URL' : 'URL or Embed Code'}</Label>
                  <Textarea 
                    id="url" 
                    value={newItemContent} 
                    onChange={(e) => setNewItemContent(e.target.value)} 
                    placeholder={
                      newItemType === 'googlesheet_embed' 
                      ? 'https://docs.google.com/spreadsheets/d/...' 
                      : 'https://example.com or <iframe ...></iframe>'
                    } 
                  />
                </div>
              )}
              {newItemType === 'multi_embed' && (<div className="p-3 bg-muted/50 rounded-md"><p className="text-sm text-muted-foreground">This will create a collection page where you can add multiple embed items. The URL will be automatically generated based on the page name.</p></div>)}
              <div className="grid gap-2"><Label htmlFor="folder">Folder</Label><Select value={newItemFolderId || 'uncategorized'} onValueChange={(value) => setNewItemFolderId(value === 'uncategorized' ? null : value)}><SelectTrigger id="folder"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uncategorized">Uncategorized</SelectItem>{foldersState.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}</SelectContent></Select></div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleAddItem} disabled={((newItemType === 'url_embed' || newItemType === 'googlesheet_embed') && !newItemContent.trim()) || addItemMutation.isPending}>{addItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add Page</Button>
              <Button variant="outline" onClick={() => { setEditingFolder(null); setIsFolderFormOpen(true); }}><FolderPlus className="mr-2 h-4 w-4" /> Add Folder</Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <EditNavItemDialog item={editingItem} open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} onSave={handleSaveEdit} isSaving={false} />
      <FolderFormDialog open={isFolderFormOpen} onOpenChange={setIsFolderFormOpen} onSave={handleSaveFolder} folder={editingFolder} isSaving={isSavingFolder} />
    </PortalLayout>
  );
};

export default NavigationSettingsPage;