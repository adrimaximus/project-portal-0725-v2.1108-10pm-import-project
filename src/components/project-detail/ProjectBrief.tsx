import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download } from "lucide-react";
import React, { useRef } from "react";
import FileIcon from "../FileIcon";

interface ProjectBriefProps {
  files: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectBrief = ({ files, isEditing, onFilesChange }: ProjectBriefProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleFileRemove = (fileToRemove: File) => {
    onFilesChange(files.filter(file => file !== fileToRemove));
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between p-2 rounded-md border bg-background">
              <div className="flex items-center gap-3 truncate">
                <FileIcon fileType={file.type} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <a
                  href={URL.createObjectURL(file)}
                  download={file.name}
                  title={`Download ${file.name}`}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download file</span>
                  </Button>
                </a>
                {isEditing && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFileRemove(file)}>
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

      {isEditing && (
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