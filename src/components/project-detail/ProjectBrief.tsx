import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { FileIcon } from "@/components/FileIcon";
import { formatFileSize } from "@/lib/utils";

interface ProjectBriefProps {
  project: Project;
}

export const ProjectBrief = ({ project }: ProjectBriefProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Brief</CardTitle>
        <CardDescription>Key details and files for this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
        <h4 className="font-semibold text-sm mb-2">Brief Files</h4>
        <div className="space-y-2">
          {project.briefFiles?.map(file => (
            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
              <FileIcon fileName={file.name} className="h-8 w-8 text-gray-500 flex-shrink-0" />
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">{file.name}</p>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};