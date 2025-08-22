import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, PlusCircle, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIconComponent } from '@/data/icons';
import { Folder as FolderIcon } from 'lucide-react';
import { KbFolder } from '@/components/kb/FolderCard';
import FolderFormDialog from '@/components/kb/FolderFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

type Article = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  profiles: { first_name: string, last_name: string };
};

const FolderDetailPage = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<KbFolder | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCollaboratorDialogOpen, setIsCollaboratorDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFolderData = async () => {
      setIsLoading(true);
      const { data: folderData, error: folderError } = await supabase
        .from('kb_folders')
        .select('*, collaborators:kb_folder_collaborators(profiles(*)), articles:kb_articles(*, profiles(first_name, last_name))')
        .eq('id', folderId)
        .single();

      if (folderError || !folderData) {
        toast.error("Folder not found or you don't have access.");
        navigate('/knowledge-base');
        return;
      }

      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) {
        setAllUsers(usersData.map(p => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email, email: p.email } as User)));
      }

      setFolder(folderData as any);
      setArticles(folderData.articles || []);
      setSelectedUserIds(folderData.collaborators.map((c: any) => c.profiles.id));
      setIsLoading(false);
    };

    if (folderId) {
      fetchFolderData();
    }
  }, [folderId, navigate]);

  const handleDeleteFolder = async () => {
    if (!folder) return;
    const { error } = await supabase.from('kb_folders').delete().eq('id', folder.id);
    if (error) {
      toast.error("Failed to delete folder.", { description: error.message });
    } else {
      toast.success("Folder deleted.");
      navigate('/knowledge-base');
    }
  };

  const handleSaveCollaborators = async () => {
    if (!folder) return;
    const currentCollaboratorIds = folder.collaborators.map(c => c.id);
    const toAdd = selectedUserIds.filter(id => !currentCollaboratorIds.includes(id));
    const toRemove = currentCollaboratorIds.filter(id => !selectedUserIds.includes(id));

    if (toAdd.length > 0) {
      const { error } = await supabase.from('kb_folder_collaborators').insert(toAdd.map(userId => ({ folder_id: folder.id, user_id: userId })));
      if (error) {
        toast.error("Failed to add collaborators.");
        return;
      }
    }
    if (toRemove.length > 0) {
      const { error } = await supabase.from('kb_folder_collaborators').delete().eq('folder_id', folder.id).in('user_id', toRemove);
      if (error) {
        toast.error("Failed to remove collaborators.");
        return;
      }
    }
    toast.success("Collaborators updated.");
    setIsCollaboratorDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
  };

  if (isLoading || !folder) {
    return <PortalLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  const Icon = getIconComponent(folder.icon) || FolderIcon;
  const isOwner = user?.id === (folder as any).created_by;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/knowledge-base"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Knowledge Base</Link>
        </Button>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${folder.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: folder.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{folder.name}</h1>
              <p className="text-muted-foreground">{folder.description}</p>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsFolderFormOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Articles ({articles.length})</CardTitle>
                {isOwner && (
                  <Button asChild size="sm">
                    <Link to="/knowledge-base/new"><PlusCircle className="mr-2 h-4 w-4" /> New Article</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {articles.length > 0 ? (
                  <div className="divide-y">
                    {articles.map(article => (
                      <Link key={article.id} to={`/knowledge-base/${article.slug}`} className="block p-3 -mx-3 hover:bg-muted rounded-md">
                        <p className="font-semibold">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          By {article.profiles.first_name} {article.profiles.last_name} • {format(new Date(article.created_at), 'PPP', { locale: id })}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No articles in this folder yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Collaborators</CardTitle>
                {isOwner && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCollaboratorDialogOpen(true)}>
                    <Users className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {(folder as any).collaborators.map((c: any) => (
                  <div key={c.profiles.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.profiles.avatar_url} />
                      <AvatarFallback>{c.profiles.first_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{c.profiles.first_name} {c.profiles.last_name}</p>
                      <p className="text-xs text-muted-foreground">{c.profiles.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isOwner && (
        <>
          <FolderFormDialog open={isFolderFormOpen} onOpenChange={setIsFolderFormOpen} onSuccess={() => {}} folder={folder} />
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete Folder?</AlertDialogTitle><AlertDialogDescription>This will delete the folder and un-assign all articles within it. The articles themselves will not be deleted. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={isCollaboratorDialogOpen} onOpenChange={setIsCollaboratorDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Manage Collaborators</DialogTitle></DialogHeader>
              <div className="py-4">
                <MultiSelect
                  options={allUsers.map(u => ({ value: u.id, label: u.name }))}
                  value={selectedUserIds}
                  onChange={setSelectedUserIds}
                  placeholder="Select users..."
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCollaboratorDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveCollaborators}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PortalLayout>
  );
};

export default FolderDetailPage;