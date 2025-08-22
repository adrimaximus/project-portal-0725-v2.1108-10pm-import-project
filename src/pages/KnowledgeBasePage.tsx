import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbFolder } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import CreateFolderDialog from '@/components/kb/CreateFolderDialog';
import FolderCard from '@/components/kb/FolderCard';

const KnowledgeBasePage = () => {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kb_folders').select('*').order('name', { ascending: true });
      if (error) {
        toast.error("Failed to fetch folders.");
        throw error;
      }
      return data as KbFolder[];
    }
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Find and manage your team's articles and documentation.</p>
          </div>
          <Button onClick={() => setIsCreateFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : folders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {folders.map(folder => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No folders yet.</p>
              <p>Click "New Folder" to get started.</p>
            </div>
          )}
        </div>
      </div>
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['kb_folders'] })}
      />
    </PortalLayout>
  );
};

export default KnowledgeBasePage;