import React, { useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatBytes } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  label?: string;
  bucket?: string;
}

const isFileObject = (file: File | FileMetadata): file is File => {
  return file instanceof File;
};

const FilePreview = ({ file, onRemove, disabled }: { file: File | FileMetadata, onRemove: () => void, disabled?: boolean }) => {
  const isImage = isFileObject(file) 
    ? file.type.startsWith('image/') 
    : file.type?.startsWith('image/');

  const previewUrl = isFileObject(file) 
    ? URL.createObjectURL(file) 
    : file.url;

  const fileName = isFileObject(file) ? file.name : file.name;
  const fileSize = isFileObject(file) ? file.size : file.size;

  React.useEffect(() => {
    return () => {
      if (isFileObject(file)) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  return (
    <div className="relative group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
        {isImage ? (
          <img src={previewUrl} alt={fileName} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(fileSize)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  );
};

const FileUploader = ({
  value = [],
  onValueChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  accept = {
    'image/*': [],
    'application/pdf': []
  },
  disabled = false,
  className,
}: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;
    const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
    onValueChange(newFiles);
  }, [value, maxFiles, onValueChange, disabled]);

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = value.filter((_, i) => i !== index);
    onValueChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept,
    disabled: disabled || value.length >= maxFiles,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          (disabled || value.length >= maxFiles) && "opacity-50 cursor-not-allowed hover:border-muted-foreground/25 hover:bg-transparent"
        )}
      >
        <input {...getInputProps()} />
        <div className="rounded-full bg-muted p-2 mb-2">
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">
          {isDragActive ? (
            <p className="text-primary">Drop the files here</p>
          ) : (
            <p>
              Drag & drop files or <span className="text-primary hover:underline">browse</span>
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, PNG, JPG up to {formatBytes(maxSize)}
        </p>
        {value.length >= maxFiles && (
          <p className="text-xs text-amber-500 mt-2 font-medium">
            Max {maxFiles} files reached
          </p>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="text-xs text-destructive space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              <span className="font-medium">{file.name}:</span> {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2 pr-4">
            {value.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default FileUploader;