import { Project, Task } from "@/types";
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
  const handleFilesAdd = (files: File[]) => {
    console.log("Files added:", files);
  };

  const handleFileDelete = (fileId: string) => {
    console.log("File deleted:", fileId);
  };

  return (
    <Tabs defaultValue="brief" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="brief">Brief & Files</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
      </TabsList>
      <TabsContent value="brief">
        <ProjectBrief
          files={project.briefFiles || []}
          isEditing={isEditing}
          onFilesChange={handleFilesAdd}
          onFileDelete={handleFileDelete}
          onSetIsEditing={() => {}}
          isUploading={false}
        />
      </TabsContent>
      <TabsContent value="comments">
        <RequestComments />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectDetailsTabs;