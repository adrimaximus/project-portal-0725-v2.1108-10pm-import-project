import React, { useCallback } from 'react'
import { useDropzone, DropzoneOptions } from 'react-dropzone'
import { UploadCloud, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

interface FileUploaderProps {
  value: (File | FileMetadata)[];
  onValueChange: (files: (File | FileMetadata)[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: DropzoneOptions['accept'];
  disabled?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader = ({
  value = [],
  onValueChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept,
  disabled = false,
  className
}: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentFilesCount = value.length;
    const filesToAdd = acceptedFiles.slice(0, maxFiles - currentFilesCount);
    if (filesToAdd.length > 0) {
      onValueChange([...value, ...filesToAdd]);
    }
  }, [value, maxFiles, onValueChange]);

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onValueChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept,
    disabled: disabled || value.length >= maxFiles
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted/50 hover:bg-muted",
          isDragActive && "border-primary bg-primary/10",
          (disabled || value.length >= maxFiles) && "opacity-50 cursor-not-allowed hover:bg-muted/50",
          className
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          {isDragActive ? "Drop files here" : "Drag & drop files here or click to select"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxFiles} files, up to {formatFileSize(maxSize)} each
        </p>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const fileName = file.name;
            const fileSize = file.size;

            return (
              <div key={index} className="flex items-center p-3 bg-background border rounded-md group">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary mr-3 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-all whitespace-normal" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileSize)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive mt-2">
            {fileRejections.map(({ file, errors }) => (
                <div key={file.name}>
                    {file.name}: {errors.map(e => e.message).join(', ')}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;