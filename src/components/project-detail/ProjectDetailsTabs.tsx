import { Project, Task } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectBrief from "./ProjectBrief";
import RequestComments from "../request/RequestComments";

interface ProjectDetailsTabsProps {
  project: Project;
  isEditing: boolean;
  onTasksUpdate: (tasks: Task[]) => void;
}

const ProjectDetailsTabs = ({ project, isEditing }: ProjectDetailsTabsProps) => {
  // Dummy handler, as file management logic is not fully specified here.
  const handleFilesChange = (files: File[]) => {
    console.log("Files updated:", files);
  };

  return (
    <Tabs defaultValue="brief" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="brief">Brief & Files</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
      </TabsList>
      <TabsContent value="brief">
        <ProjectBrief
          files={project.files || []}
          isEditing={isEditing}
          onFilesChange={handleFilesChange}
        />
      </TabsContent>
      <TabsContent value="comments">
        <RequestComments />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectDetailsTabs;