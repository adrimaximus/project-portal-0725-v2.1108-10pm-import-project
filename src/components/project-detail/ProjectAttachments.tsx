import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface Attachment {
  name: string;
  url: string;
}

interface ProjectAttachmentsProps {
  attachments: Attachment[];
  newFiles: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectAttachments = ({ attachments, newFiles, isEditing, onFilesChange }: ProjectAttachmentsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const addedFiles = Array.from(event.target.files);
      onFilesChange([...newFiles, ...addedFiles]);
    }
  };

  const handleRemoveNewFile = (fileToRemove: File) => {
    onFilesChange(newFiles.filter(f => f !== fileToRemove));
  };

  const hasFiles = attachments.length > 0 || newFiles.length > 0;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Attachments</h3>
      {hasFiles ? (
        <ul className="space-y-2">
          {attachments.map((file, index) => (
            <li key={`existing-${index}`} className="flex items-center justify-between bg-muted p-2 rounded-md">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:underline min-w-0">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </a>
            </li>
          ))}
          {newFiles.map((file, index) => (
             <li key={`new-${index}`} className="flex items-center justify-between bg-muted p-2 rounded-md">
              <div className="flex items-center space-x-2 min-w-0">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              {isEditing && (
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => handleRemoveNewFile(file)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No files attached.</p>
      )}
      {isEditing && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </>
      )}
    </div>
  );
};

export default ProjectAttachments;