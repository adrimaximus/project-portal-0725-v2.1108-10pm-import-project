import { Paperclip, FileText, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// This should match the type from your API
export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  size: number;
  type: string;
}

interface ProjectBriefProps {
  files: ProjectFile[];
  isEditing: boolean;
  onSetIsEditing: (isEditing: boolean) => void;
  onFilesChange: (files: File[]) => void;
  onFileDelete: (filePath: string) => void;
  isUploading: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ProjectBrief = ({ files, isEditing, onSetIsEditing, onFilesChange, onFileDelete, isUploading }: ProjectBriefProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesChange(acceptedFiles);
  }, [onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: isUploading });

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <h3 className="font-semibold">Brief & Attachments</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSetIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
            isUploading && 'cursor-not-allowed opacity-50'
          )}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadCloud className="h-8 w-8" />
              {isUploading ? (
                <p>Uploading files...</p>
              ) : isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag 'n' drop files here, or click to select</p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {files && files.map((file) => (
              <div key={file.id || file.name} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={file.name}>
                    {file.name}
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  <Button variant="ghost" size="icon" onClick={() => onFileDelete(file.storage_path)} className="h-6 w-6">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="bg-muted/50 p-4 rounded-lg group cursor-pointer transition-colors hover:bg-muted min-h-[100px]"
      onClick={() => onSetIsEditing(true)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="h-4 w-4" />
        <h3 className="font-semibold">Brief & Attachments</h3>
      </div>
      {files && files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id || file.name} className="flex items-center gap-3 p-2 bg-background rounded-md text-sm">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={file.name}>
                {file.name}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center flex items-center justify-center h-full pt-4">
          <p className="text-muted-foreground group-hover:text-foreground">Click to add brief files.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectBrief;