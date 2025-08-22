import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { KbFolder } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Folder, FileText } from 'lucide-react';

const fetchFolderBySlug = async (slug: string): Promise<KbFolder | null> => {
  const { data, error } = await supabase
    .from('kb_folders')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found is not an error
    toast.error("Failed to fetch folder details.");
    console.error(error);
    return null;
  }
  return data;
};

const FolderDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: folder, isLoading } = useQuery({
    queryKey: ['kb_folder', slug],
    queryFn: () => fetchFolderBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!folder) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Folder Not Found</h2>
          <p className="text-muted-foreground">The folder you are looking for does not exist.</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/knowledge-base">Knowledge Base</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {folder.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold">{folder.name}</h1>
          <p className="text-muted-foreground mt-2">{folder.description}</p>
        </div>

        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">No articles in this folder yet.</p>
          <p className="text-sm">Articles added to this folder will appear here.</p>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FolderDetailPage;