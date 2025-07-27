import { File as FileIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectBriefProps {
  files: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectBrief = ({ files, isEditing }: ProjectBriefProps) => {
  return (
    <>
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="ml-2 flex-shrink-0 text-xs">{(file.size / 1024).toFixed(2)} KB</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No brief files attached.</p>
      )}
      {isEditing && (
        <div className="mt-4">
          <Button variant="outline" size="sm" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      )}
    </>
  );
};

export default ProjectBrief;