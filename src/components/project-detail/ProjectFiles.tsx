import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, ProjectFile } from "@/data/projects";
import { FileText, Download, Paperclip, FileImage, FileZip } from "lucide-react";
import { Button } from "../ui/button";
import FileUploader from "../request/FileUploader";

interface ProjectFilesProps {
  project: Project;
  onFilesUpdate: (files: File[]) => void;
}

const FileIcon = ({ type }: { type: string }) => {
  if (type.startsWith("image/")) {
    return <FileImage className="h-6 w-6 text-gray-500" />;
  }
  if (type === "application/zip" || type === "application/x-zip-compressed") {
    return <FileZip className="h-6 w-6 text-gray-500" />;
  }
  if (type === "application/pdf") {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  return <Paperclip className="h-6 w-6 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ProjectFiles = ({ project, onFilesUpdate }: ProjectFilesProps) => {
  const allFiles = [...(project.briefFiles || []), ...(project.files || [])];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Files</CardTitle>
        <CardDescription>All documents and assets related to this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allFiles.length > 0 ? (
            <ul className="divide-y divide-border rounded-md border">
              {allFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <FileIcon type={file.type || ""} />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" asChild>
                    <a href={file.url} download={file.name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No files have been uploaded yet.</p>
          )}
        </div>
        <div className="mt-6">
          <FileUploader onFilesChange={onFilesUpdate} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFiles;