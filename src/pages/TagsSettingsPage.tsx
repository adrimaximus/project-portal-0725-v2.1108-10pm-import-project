import { useState, useMemo } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, Search, ArrowUp, ArrowDown } from "lucide-react";
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

type SortableTagColumns = 'name' | 'type' | 'color' | 'lead_time';
type SortableGroupColumns = 'name' | 'count';
type SortDirection = 'asc' | 'desc';

const TagsSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState('tags');
  const [activeTagTab, setActiveTagTab] = useState('personal');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [tagSort, setTagSort] = useState<{ column: SortableTagColumns; direction: SortDirection }>({ column: 'name', direction: 'asc' });
  const [groupSort, setGroupSort] = useState<{ column: SortableGroupColumns; direction: SortDirection }>({ column: 'name', direction: 'asc' });

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

  const tagGroups = [...new Set(tags.map(tag => tag.type || 'general'))];
  const groupCounts = tags.reduce((acc, tag) => {
    const group = tag.type || 'general';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
        const groupMatch = (tag.type || 'general').toLowerCase().includes(query);
        return nameMatch || groupMatch;
      })
      .sort((a, b) => {
        const aVal = a[tagSort.column] || (tagSort.column === 'type' ? 'general' : (tagSort.column === 'lead_time' ? 0 : ''));
        const bVal = b[tagSort.column] || (tagSort.column === 'type' ? 'general' : (tagSort.column === 'lead_time' ? 0 : ''));
        if (aVal < bVal) return tagSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return tagSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [personalTags, globalTags, activeTagTab, searchQuery, tagSort]);

  const sortedTagGroups = [...tagGroups].sort((a, b) => {
    const aVal = groupSort.column === 'name' ? a : groupCounts[a] || 0;
    const bVal = groupSort.column === 'name' ? b : groupCounts[b] || 0;
    if (aVal < bVal) return groupSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return groupSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddNew = () => {
    setTagToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setTagToEdit(tag);
    setIsFormOpen(true);
  };

  const handleSave = async (tagData: Omit<Tag, 'id' | 'user_id'>) => {
    if (!user) return;
    setIsSaving(true);
    const userIdForTag = tagToEdit ? tagToEdit.user_id : (activeTagTab === 'global' && isAdmin ? null : user.id);
    const upsertData = { ...tagData, user_id: userIdForTag, id: tagToEdit?.id, type: tagData.type || 'general' };

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

    const { error } = await supabase
      .from('tags')
      .update({ type: newGroupName })
      .eq('user_id', user.id)
      .eq('type', groupToRename);

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

    const { error } = await supabase
      .from('tags')
      .update({ type: 'general' })
      .eq('user_id', user.id)
      .eq('type', groupToDelete);

    if (error) {
      toast.error(`Failed to delete group: ${error.message}`);
    } else {
      toast.success(`Group "${groupToDelete}" deleted. Tags moved to 'general'.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
    }
    setGroupToDelete(null);
  };

  const SortableHeader = ({ column, label, onSort, sortConfig }: { column: any, label: string, onSort: (col: any) => void, sortConfig: { column: any, direction: SortDirection } }) => (
    <TableHead onClick={() => onSort(column)} className="cursor-pointer p-2">
      <div className="flex items-center">
        {label}
        {sortConfig.column === column && (
          sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  const formatLeadTime = (hours: number | null | undefined): string => {
    if (hours === null || typeof hours === 'undefined' || hours < 0) {
      return '-';
    }
    if (hours === 0) {
      return '0h';
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    let result = '';
    if (days > 0) {
      result += `${days}d`;
    }
    if (remainingHours > 0) {
      result += `${result ? ' ' : ''}${remainingHours}h`;
    }
    
    return result;
  };

  const renderTagsTable = (tagsToRender: Tag[], isEditable: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader column="name" label="Name" onSort={handleTagSort} sortConfig={tagSort} />
          <SortableHeader column="type" label="Group" onSort={handleTagSort} sortConfig={tagSort} />
          <SortableHeader column="color" label="Color" onSort={handleTagSort} sortConfig={tagSort} />
          <SortableHeader column="lead_time" label="Lead Time (hours)" onSort={handleTagSort} sortConfig={tagSort} />
          {properties.map(prop => (
            <TableHead key={prop.id}>{prop.label}</TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={5 + properties.length} className="text-center">Loading tags...</TableCell></TableRow>
        ) : tagsToRender.length === 0 ? (
          <TableRow><TableCell colSpan={5 + properties.length} className="text-center h-24">
            {searchQuery ? `No tags found for "${searchQuery}"` : `No tags in this category.`}
          </TableCell></TableRow>
        ) : tagsToRender.map(tag => (
          <TableRow key={tag.id}>
            <TableCell className="font-medium">{tag.name}</TableCell>
            <TableCell className="capitalize">{tag.type || 'general'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="font-mono text-sm hidden sm:inline">{tag.color}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">{formatLeadTime(tag.lead_time)}</TableCell>
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
        ))}
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
                      <SortableHeader column="name" label="Group Name" onSort={handleGroupSort} sortConfig={groupSort} />
                      <SortableHeader column="count" label="Tags" onSort={handleGroupSort} sortConfig={groupSort} />
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
              This will not delete the tags within this group. Instead, all tags will be moved to the "general" group. This action cannot be undone.
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