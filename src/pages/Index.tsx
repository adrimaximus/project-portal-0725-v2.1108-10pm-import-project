import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/contexts/ProjectContext";
import { PlusCircle } from "lucide-react";

const IndexPage = () => {
  const { projects } = useProjects();

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
            </Button>
          </div>
        </div>
        <ProjectsTable columns={columns} data={projects} />
      </main>
    </div>
  );
};

export default IndexPage;