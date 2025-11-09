import PortalLayout from "@/components/PortalLayout";
import CollaboratorsList from "@/components/team-overview/CollaboratorsList";

const TeamOverviewPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get insights into your team's performance and workload.
          </p>
        </div>
        <CollaboratorsList />
      </div>
    </PortalLayout>
  );
};

export default TeamOverviewPage;