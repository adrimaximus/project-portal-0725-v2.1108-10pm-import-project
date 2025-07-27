import { Card, CardContent } from "@/components/ui/card";
import { File as FileIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectBriefProps {
  files: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectBrief = ({ files, isEditing }: ProjectBriefProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 truncate">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-muted-foreground ml-2 flex-shrink-0">{(file.size / 1024).toFixed(2)} KB</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No brief files attached.</p>
        )}
        {isEditing && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectBrief;