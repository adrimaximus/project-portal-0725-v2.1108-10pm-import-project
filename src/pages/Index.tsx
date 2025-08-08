import ProjectsTable from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";

const IndexPage = () => {
  return (
    <div className="container mx-auto py-10">
      <ProjectsTable projects={dummyProjects} />
    </div>
  );
};

export default IndexPage;