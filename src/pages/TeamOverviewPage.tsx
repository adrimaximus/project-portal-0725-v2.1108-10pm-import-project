import PortalLayout from "@/components/PortalLayout";
import CollaboratorsList from "@/components/dashboard/CollaboratorsList";
import { useProjects } from "@/hooks/useProjects";
import { Loader2 } from "lucide-react";

const TeamOverviewPage = () => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects({ fetchAll: true });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get insights into your team's performance and workload.
          </p>
        </div>
        {isLoadingProjects ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CollaboratorsList projects={projects} />
        )}
      </div>
    </PortalLayout>
  );
};

export default TeamOverviewPage;