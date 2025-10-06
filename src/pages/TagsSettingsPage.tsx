import { useState } from 'react';
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
import { Tag, FeatureFlag } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import TagFormDialog from '@/components/settings/TagFormDialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RenameGroupDialog from '@/components/settings/RenameGroupDialog';

const TagsSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState('tags');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name');
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  const { data: featureFlags = [], isLoading: isLoadingFeatureFlags } = useQuery({
    queryKey: ['feature_flags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feature_flags').select('*');
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const defaultGroupsConfig = [
    { name: 'project', featureFlag: 'module:projects' },
    { name: 'task', featureFlag: 'module:projects' },
    { name: 'goals', featureFlag: 'module:goals' },
    { name: 'knowledge base', featureFlag: 'module:knowledge-base' },
    { name: 'people', featureFlag: 'module:people' },
    { name: 'company', featureFlag: 'module:people' },
    { name: 'billing', featureFlag: 'module:billing' },
  ];

  const enabledFeatureFlags = new Set(
    featureFlags.filter(ff => ff.is_enabled).map(ff => ff.id)
  );

  const activeDefaultGroups = defaultGroupsConfig
    .filter(dg => enabledFeatureFlags.has(dg.featureFlag))
    .map(dg => dg.name);

  const userCreatedGroups = [...new Set(tags.map(tag => tag.type || 'general'))];
  
  const tagGroups = [...new Set(['general', ...activeDefaultGroups, ...userCreatedGroups])].sort();

  const groupCounts = tags.reduce((acc, tag) => {
    const group = tag.type || 'general';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const upsertData = { ...tagData, user_id: user.id, id: tagToEdit?.id, type: tagData.type || 'general' };

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

  const isLoading = isLoadingTags || isLoadingFeatureFlags;

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
            {mainTab === 'tags' ? (
              <Button onClick={handleAddNew} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Tag
              </Button>
            ) : (
              <Button onClick={handleAddNew} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Group
              </Button>
            )}
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
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full md:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center">Loading tags...</TableCell></TableRow>
                    ) : filteredTags.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center h-24">
                        {searchQuery ? `No tags found for "${searchQuery}"` : `You haven't created any tags yet.`}
                      </TableCell></TableRow>
                    ) : filteredTags.map(tag => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell className="capitalize">{tag.type || 'general'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                            <span className="font-mono text-sm hidden sm:inline">{tag.color}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(tag)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setTagToDelete(tag)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tag Groups</CardTitle>
                <CardDescription>Organize your tags into groups. To create a new group, click 'New Group' and create the first tag for it.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center">Loading groups...</TableCell></TableRow>
                    ) : tagGroups.map(group => (
                      <TableRow key={group}>
                        <TableCell className="font-medium capitalize">{group}</TableCell>
                        <TableCell>{groupCounts[group] || 0}</TableCell>
                        <TableCell className="text-right">
                          {group !== 'general' && !activeDefaultGroups.includes(group) && (
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