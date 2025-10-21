import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskAttachment } from '@/types';
import FileIcon from '../FileIcon';

interface TaskFileUploadProps {
  existingFiles: TaskAttachment[];
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  onExistingFileDelete: (fileId: string) => void;
}

const TaskFileUpload = ({ existingFiles, newFiles, onNewFilesChange, onExistingFileDelete }: TaskFileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const updatedFiles = [...newFiles, ...acceptedFiles];
    onNewFilesChange(updatedFiles);
  }, [newFiles, onNewFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeNewFile = (fileToRemove: File) => {
    onNewFilesChange(newFiles.filter(file => file !== fileToRemove));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadCloud className="h-8 w-8" />
          <p>{isDragActive ? 'Drop files here...' : "Drag 'n' drop files here, or click to select"}</p>
        </div>
      </div>
      
      {(existingFiles.length > 0 || newFiles.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Attachments ({existingFiles.length + newFiles.length})</h4>
          <ul className="space-y-2">
            {existingFiles.map(file => (
              <li key={file.id} className="flex items-center justify-between p-2 rounded-md border bg-background">
                <div className="flex items-center gap-3 truncate">
                  <FileIcon fileType={file.file_type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col truncate">
                    <span className="truncate text-sm font-medium">{file.file_name}</span>
                    {file.file_size != null && <span className="text-xs text-muted-foreground">{formatBytes(file.file_size)}</span>}
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onExistingFileDelete(file.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {newFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                <div className="flex items-center gap-3 truncate">
                  <FileIcon fileType={file.type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col truncate">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeNewFile(file)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskFileUpload;