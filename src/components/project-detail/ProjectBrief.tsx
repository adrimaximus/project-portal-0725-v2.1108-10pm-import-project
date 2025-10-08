import { ProjectFile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Trash2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useRef } from "react";

export interface ProjectBriefProps {
  files: ProjectFile[];
  isEditing: boolean;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
}

const ProjectBrief = ({ files, isEditing, onFilesAdd, onFileDelete }: ProjectBriefProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesAdd(Array.from(event.target.files));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Brief & Files</CardTitle>
        {isEditing && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <ul className="space-y-3">
            {files.map((file: ProjectFile) => (
              <li key={file.id} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                     <Button variant="ghost" size="icon" onClick={() => onFileDelete(file.id)}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                  )}
                  <Button asChild variant="ghost" size="icon">
                    <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
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