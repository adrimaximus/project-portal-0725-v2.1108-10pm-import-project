import { Project } from "@/data/projects";
import { ProjectsTable, columns } from "@/components/ProjectsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentProjectsProps {
  projects: Project[];
  statusFilter: string;
}

const RecentProjects = ({ projects }: RecentProjectsProps) => {
  const tableColumns = columns.filter(c => 
    c.id !== 'select' && 
    c.id !== 'actions' &&
    c.accessorKey !== 'progress' &&
    c.accessorKey !== 'paymentDueDate'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectsTable columns={tableColumns} data={projects} />
      </CardContent>
    </Card>
  );
};

export default RecentProjects;