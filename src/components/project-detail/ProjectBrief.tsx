import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { File as FileIcon, Upload, X } from "lucide-react";

interface ProjectBriefProps {
  files: File[];
  isEditing: boolean;
  onFilesChange: (files: File[]) => void;
}

const ProjectBrief = ({ files, isEditing, onFilesChange }: ProjectBriefProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesChange([...files, ...Array.from(event.target.files)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    onFilesChange(files.filter(file => file !== fileToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Brief & Files</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing && (
          <div className="mb-4">
            <label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
              <span className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  Drop files to attach, or <span className="text-primary">browse</span>
                </span>
              </span>
              <input id="file-upload" name="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        )}
        <div className="space-y-2">
          {files.length > 0 ? (
            files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                </div>
                {isEditing && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(file)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No files attached.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBrief;