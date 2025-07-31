import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectFilesProps {
  project: Project;
}

const ProjectFiles = ({ project }: ProjectFilesProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {project.files && project.files.length > 0 ? (
            project.files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href={file.url} download={file.name}>
                    <Download className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFiles;