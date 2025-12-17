"use client";

import { useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { X, UploadCloud, File as FileIcon, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

interface FileUploaderProps {
  value?: (File | FileMetadata)[];
  onValueChange?: (files: (File | FileMetadata)[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

const FileUploader = ({
  value = [],
  onValueChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    'image/*': [],
    'application/pdf': [],
    'application/msword': [],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    'application/vnd.ms-excel': [],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  },
  disabled = false,
  className,
}: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        console.warn('Rejected files', rejectedFiles);
      }
      
      const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
      onValueChange?.(newFiles);
    },
    [value, maxFiles, onValueChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled: disabled || value.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onValueChange?.(newFiles);
  };

  const getFileIcon = (file: File | FileMetadata) => {
    const type = 'type' in file ? file.type : '';
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />;
    return <FileIcon className="h-5 w-5 text-blue-500" />;
  };

  const getFileUrl = (file: File | FileMetadata) => {
    if ('url' in file && typeof file.url === 'string') return file.url;
    if (file instanceof File) return URL.createObjectURL(file);
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25",
          (disabled || value.length >= maxFiles) && "opacity-50 cursor-not-allowed hover:border-muted-foreground/25 hover:bg-transparent"
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-muted p-3 rounded-full mb-3">
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">
          <span className="text-primary">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Supported formats: Images, PDF, Docs (max. {formatFileSize(maxSize)})
        </p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const isImage = file.type?.startsWith('image/');
            const url = getFileUrl(file);

            return (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden relative border">
                    {isImage && url ? (
                      <img 
                        src={url} 
                        alt={file.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
    </div>
  );
};

export default FileUploader;