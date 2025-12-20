import { useState, useMemo } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, Search } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tag, CustomProperty } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import TagFormDialog from '@/components/settings/TagFormDialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RenameGroupDialog from '@/components/settings/RenameGroupDialog';
import { SortableTableHead } from '@/components/ui/SortableTableHead';

type SortableTagColumns = 'name' | 'groups' | 'color';
type SortableGroupColumns = 'name' | 'count';
type SortDirection = 'asc' | 'desc';

const pleasantColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e'
];
const getRandomPleasantColor = () => pleasantColors[Math.floor(Math.random() * pleasantColors.length)];

const TagsSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState('tags');
  const [activeTagTab, setActiveTagTab] = useState('personal');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Partial<Tag> | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [tagSort, setTagSort] = useState<{ column: SortableTagColumns | null; direction: SortDirection }>({ column: 'name', direction: 'asc' });
  const [groupSort, setGroupSort] = useState<{ column: SortableGroupColumns | null; direction: SortDirection }>({ column: 'name', direction: 'asc' });

  const isAdmin = user?.role === 'admin' || user?.role === 'master admin';

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  const { data: properties = [] } = useQuery<CustomProperty[]>({
    queryKey: ['custom_properties', 'tag'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'tag');
      if (error) throw error;
      return data;
    },
  });

  const { personalTags, globalTags } = useMemo(() => {
    const personal: Tag[] = [];
    const global: Tag[] = [];
    tags.forEach(tag => {
      if (tag.user_id) {
        personal.push(tag);
      } else {
        global.push(tag);
      }
    });
    return { personalTags: personal, globalTags: global };
  }, [tags]);

  const tagGroups = useMemo(() => {
    const allGroups = new Set<string>();
    tags.forEach(tag => {
      if (tag.groups && tag.groups.length > 0) {
        tag.groups.forEach(g => allGroups.add(g));
      } else if (tag.type) {
        allGroups.add(tag.type);
      } else {
        allGroups.add('general');
      }
    });
    return Array.from(allGroups);
  }, [tags]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach(tag => {
      const groups = (tag.groups && tag.groups.length > 0) ? tag.groups : [tag.type || 'general'];
      groups.forEach(g => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return counts;
  }, [tags]);

  const handleTagSort = (column: SortableTagColumns) => {
    setTagSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleGroupSort = (column: SortableGroupColumns) => {
    setGroupSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedTags = useMemo(() => {
    const tagsToProcess = activeTagTab === 'personal' ? personalTags : globalTags;
    return [...tagsToProcess]
      .filter(tag => {
        const query = searchQuery.toLowerCase();
        const nameMatch = tag.name.toLowerCase().includes(query);
        const groupMatch = (tag.groups || [tag.type || 'general']).some(g => g.toLowerCase().includes(query));
        return nameMatch || groupMatch;
      })
      .sort((a, b) => {
        if (!tagSort.column) return 0;
        let aVal = '', bVal = '';

        if (tagSort.column === 'groups') {
          aVal = (a.groups || [a.type || 'general']).join(', ');
          bVal = (b.groups || [b.type || 'general']).join(', ');
        } else {
          aVal = String(a[tagSort.column] || '');
          bVal = String(b[tagSort.column] || '');
        }
        
        const compareResult = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });

        return tagSort.direction === 'asc' ? compareResult : -compareResult;
      });
  }, [personalTags, globalTags, activeTagTab, searchQuery, tagSort]);

  const sortedTagGroups = [...tagGroups].sort((a, b) => {
    if (!groupSort.column) return 0;
    const aVal = groupSort.column === 'name' ? a : groupCounts[a] || 0;
    const bVal = groupSort.column === 'name' ? b : groupCounts[b] || 0;
    
    let compareResult = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
        compareResult = aVal - bVal;
    } else {
        compareResult = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
    }

    return groupSort.direction === 'asc' ? compareResult : -compareResult;
  });

  const handleAddNew = () => {
    setTagToEdit({ color: getRandomPleasantColor() });
    setIsFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setTagToEdit(tag);
    setIsFormOpen(true);
  };

  const handleSave = async (tagData: Omit<Tag, 'id' | 'user_id'>) => {
    if (!user) return;
    setIsSaving(true);
    
    const isEdit = tagToEdit && tagToEdit.id;
    
    const userIdForTag = isEdit 
      ? tagToEdit.user_id 
      : (activeTagTab === 'global' && isAdmin ? null : user.id);

    // Make sure we save groups correctly
    const upsertData = { 
      ...tagData, 
      user_id: userIdForTag, 
      id: tagToEdit?.id, 
      groups: tagData.groups || [],
      type: tagData.type || (tagData.groups && tagData.groups.length > 0 ? tagData.groups[0] : 'general')
    };

    const { error } = await supabase.from('tags').upsert(upsertData);
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save tag: ${error.message}`);
    } else {
      toast.success(`Tag "${tagData.name}" saved.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    const { error } = await supabase.from('tags').delete().eq('id', tagToDelete.id);
    if (error) {
      toast.error(`Failed to delete tag: ${error.message}`);
    } else {
      toast.success(`Tag "${tagToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
    }
    setTagToDelete(null);
  };

  const handleRenameGroup = (groupName: string) => {
    setGroupToRename(groupName);
    setIsRenameDialogOpen(true);
  };

  const handleSaveGroupName = async (newGroupName: string) => {
    if (!user || !groupToRename) return;

    // This operation is trickier with array column.
    // We need to fetch tags that contain the old group, remove it, add new one.
    // Doing it client-side for simplicity, then bulk update? Or RPC?
    // Let's do client-side iteration for now as volume is likely low.
    
    const tagsToUpdate = tags.filter(t => 
      t.user_id === user.id && 
      (t.groups?.includes(groupToRename) || t.type === groupToRename)
    );

    const updates = tagsToUpdate.map(t => {
      const currentGroups = t.groups || (t.type ? [t.type] : []);
      const newGroups = currentGroups.map(g => g === groupToRename ? newGroupName : g);
      // Ensure unique
      const uniqueNewGroups = [...new Set(newGroups)];
      
      return {
        id: t.id,
        groups: uniqueNewGroups,
        type: uniqueNewGroups.length > 0 ? uniqueNewGroups[0] : null
      };
    });

    const { error } = await supabase.from('tags').upsert(updates);

    if (error) {
      toast.error(`Failed to rename group: ${error.message}`);
    } else {
      toast.success(`Group "${groupToRename}" renamed to "${newGroupName}".`);
      await queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
      setIsRenameDialogOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete || groupToDelete === 'general' || !user) return;

    const tagsToUpdate = tags.filter(t => 
      t.user_id === user.id && 
      (t.groups?.includes(groupToDelete) || t.type === groupToDelete)
    );

    const updates = tagsToUpdate.map(t => {
      const currentGroups = t.groups || (t.type ? [t.type] : []);
      const newGroups = currentGroups.filter(g => g !== groupToDelete);
      
      // If empty, default to general or empty array?
      // Usually users expect tags to remain but unassigned from group.
      
      return {
        id: t.id,
        groups: newGroups,
        type: newGroups.length > 0 ? newGroups[0] : 'general'
      };
    });

    const { error } = await supabase.from('tags').upsert(updates);

    if (error) {
      toast.error(`Failed to delete group: ${error.message}`);
    } else {
      toast.success(`Group "${groupToDelete}" removed from tags.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
    }
    setGroupToDelete(null);
  };

  const renderTagsTable = (tagsToRender: Tag[], isEditable: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead columnKey="name" onSort={handleTagSort as any} sortConfig={tagSort as any}>Name</SortableTableHead>
          <SortableTableHead columnKey="groups" onSort={handleTagSort as any} sortConfig={tagSort as any}>Groups</SortableTableHead>
          <SortableTableHead columnKey="color" onSort={handleTagSort as any} sortConfig={tagSort as any}>Color</SortableTableHead>
          {properties.map(prop => (
            <TableHead key={prop.id}>{prop.label}</TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={4 + properties.length} className="text-center">Loading tags...</TableCell></TableRow>
        ) : tagsToRender.length === 0 ? (
          <TableRow><TableCell colSpan={4 + properties.length} className="text-center h-24">
            {searchQuery ? `No tags found for "${searchQuery}"` : `No tags in this category.`}
          </TableCell></TableRow>
        ) : tagsToRender.map(tag => {
            const displayGroups = (tag.groups && tag.groups.length > 0) ? tag.groups : (tag.type ? [tag.type] : ['general']);
            return (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {displayGroups.map((g, i) => (
                      <Badge key={i} variant="outline" className="capitalize text-xs">{g}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-mono text-sm hidden sm:inline">{tag.color}</span>
                  </div>
                </TableCell>
                {properties.map(prop => (
                  <TableCell key={prop.id}>
                    {tag.custom_properties?.[prop.name] ? String(tag.custom_properties[prop.name]) : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {isEditable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEdit(tag)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setTagToDelete(tag)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
        })}
      </TableBody>
    </Table>
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Tags</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Tags</h1>
          <p className="text-muted-foreground">Create and manage your personal tags and tag groups.</p>
        </div>

        <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as 'tags' | 'groups')} defaultValue="tags">
          <div className="flex justify-between items-end">
            <TabsList>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tags" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <CardTitle>All Tags</CardTitle>
                    <CardDescription>These tags are available for you to use across the application.</CardDescription>
                  </div>
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or group..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full md:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTagTab} onValueChange={setActiveTagTab} defaultValue="personal">
                  <div className="flex justify-between items-end">
                    <TabsList>
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="global">Global</TabsTrigger>
                    </TabsList>
                    <Button onClick={handleAddNew} size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> New {activeTagTab === 'global' && isAdmin ? 'Global' : 'Personal'} Tag
                    </Button>
                  </div>
                  <TabsContent value="personal" className="mt-4">
                    {renderTagsTable(sortedTags, true)}
                  </TabsContent>
                  <TabsContent value="global" className="mt-4">
                    {renderTagsTable(sortedTags, isAdmin)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tag Groups</CardTitle>
                <CardDescription>Organize your tags into groups. Create a new group by creating or editing a tag.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead columnKey="name" onSort={handleGroupSort as any} sortConfig={groupSort as any}>Group Name</SortableTableHead>
                      <SortableTableHead columnKey="count" onSort={handleGroupSort as any} sortConfig={groupSort as any}>Tags</SortableTableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center">Loading groups...</TableCell></TableRow>
                    ) : sortedTagGroups.map(group => (
                      <TableRow key={group}>
                        <TableCell className="font-medium capitalize">{group}</TableCell>
                        <TableCell>{groupCounts[group] || 0}</TableCell>
                        <TableCell className="text-right">
                          {group !== 'general' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleRenameGroup(group)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setGroupToDelete(group)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TagFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        tag={tagToEdit}
        isSaving={isSaving}
        groups={tagGroups}
      />

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{tagToDelete?.name}" tag. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RenameGroupDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        groupName={groupToRename}
        onSave={handleSaveGroupName}
      />

      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group "{groupToDelete}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not delete the tags within this group. Instead, the tags will be removed from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Delete Group</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default TagsSettingsPage;