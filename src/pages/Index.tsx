import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectStats from "@/components/ProjectStats";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredProjects = dummyProjects.filter(project => {
    if (statusFilter === "All") return true;
    if (statusFilter === "In Progress") return project.status === "In Progress";
    if (statusFilter === "Completed") return ["Completed", "Done", "Billed"].includes(project.status);
    if (statusFilter === "Requested") return project.status === "Requested";
    return project.status === statusFilter;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigate("/request")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>
        </div>

        <ProjectStats projects={dummyProjects} />

        <div className="flex items-center justify-between">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Requested">Requested</TabsTrigger>
              <TabsTrigger value="In Progress">In Progress</TabsTrigger>
              <TabsTrigger value="Completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ProjectsTable columns={columns} data={filteredProjects} />
      </div>
    </div>
  );
};

export default Index;