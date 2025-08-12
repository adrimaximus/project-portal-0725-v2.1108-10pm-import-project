import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

const ProjectsPage = () => {
  const { data: projects, isLoading, error } = useProjects();

  return (
    <PortalLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Proyek</h1>
          <CreateProjectDialog />
        </div>
        
        {isLoading && (
          <div className="border rounded-lg">
             <div className="p-4">
                <Skeleton className="h-8 w-1/4 mb-4" />
             </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-10 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>Gagal memuat proyek. Silakan coba lagi nanti.</p>
          </div>
        )}

        {!isLoading && !error && projects && (
          <ProjectsTable projects={projects} />
        )}
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;