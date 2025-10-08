import { Project, ProjectFile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "../ui/button";

export interface ProjectBriefProps {
  project: Project;
}

const ProjectBrief = ({ project }: ProjectBriefProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brief & Files</CardTitle>
      </CardHeader>
      <CardContent>
        {project.briefFiles && project.briefFiles.length > 0 ? (
          <ul className="space-y-3">
            {project.briefFiles.map((file: ProjectFile) => (
              <li key={file.id} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No files attached to the brief.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectBrief;