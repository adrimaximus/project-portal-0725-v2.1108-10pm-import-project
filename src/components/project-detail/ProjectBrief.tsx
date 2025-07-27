import { useState, useEffect } from "react";
import { File as FileIcon, Upload, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectBriefProps {
  files: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectBrief = ({ files, isEditing }: ProjectBriefProps) => {
  const [fileUrls, setFileUrls] = useState<string[]>([]);

  useEffect(() => {
    const newUrls = files.map(file => URL.createObjectURL(file));
    setFileUrls(newUrls);

    // Cleanup function to revoke object URLs to prevent memory leaks
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <>
      {files.length > 0 ? (
        <ul className="space-y-3">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-3 truncate">
                {file.type.startsWith("image/") && fileUrls[index] ? (
                  <a href={fileUrls[index]} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <img
                      src={fileUrls[index]}
                      alt={file.name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="truncate">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="ml-4 flex flex-shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="icon">
                  <a href={fileUrls[index]} target="_blank" rel="noopener noreferrer" title="Preview file">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Preview {file.name}</span>
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon">
                  <a href={fileUrls[index]} download={file.name} title="Download file">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download {file.name}</span>
                  </a>
                </Button>
              </div>
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