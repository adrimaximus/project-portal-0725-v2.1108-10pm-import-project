import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download } from "lucide-react";
import React, { useRef } from "react";
import FileIcon from "../FileIcon";
import { ProjectFile } from "@/types";

interface ProjectBriefProps {
  files: ProjectFile[];
  isEditing: boolean;
  canUpload: boolean;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
}

const ProjectBrief = ({ files, isEditing, canUpload, onFilesAdd, onFileDelete }: ProjectBriefProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      onFilesAdd(newFiles);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between p-2 rounded-md border bg-background">
              <div className="flex items-center gap-3 truncate">
                <FileIcon fileType={file.type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <a
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Download ${file.name}`}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download file</span>
                  </Button>
                </a>
                {isEditing && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onFileDelete(file.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No files attached.</p>
      )}

      {canUpload && (
        <>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileAdd}
            className="hidden"
          />
          <Button variant="outline" className="w-full" onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Files
          </Button>
        </>
      )}
    </div>
  );
};

export default ProjectBrief;