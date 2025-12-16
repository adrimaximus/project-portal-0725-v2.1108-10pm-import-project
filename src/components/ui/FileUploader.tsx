import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, X, FileText } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath?: string;
  originalFile?: File; 
}

interface FileUploaderProps {
  bucket?: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  onFileProcessed?: (file: UploadedFile) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  disabled = false,
  onFileProcessed
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (disabled) return;

    // Handle rejections
    fileRejections.forEach((rejection) => {
      rejection.errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`File ${rejection.file.name} is too large. Max size is ${maxSize / 1024 / 1024}MB.`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`File ${rejection.file.name} has an invalid type.`);
        } else {
          toast.error(`Error uploading ${rejection.file.name}: ${error.message}`);
        }
      });
    });

    // Handle accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
        const fileUrl = URL.createObjectURL(file);
        return {
            name: file.name,
            url: fileUrl,
            size: file.size,
            type: file.type,
            originalFile: file
        };
    });

    // Check max files limit
    if (value.length + newFiles.length > maxFiles) {
        toast.error(`You can only upload a maximum of ${maxFiles} files.`);
        return;
    }

    const updatedFiles = [...value, ...newFiles];
    onChange(updatedFiles);

    // Trigger processing for new files (e.g. AI extraction)
    if (onFileProcessed) {
        newFiles.forEach(file => onFileProcessed(file));
    }

  }, [value, maxFiles, maxSize, onChange, onFileProcessed, disabled]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = [...value];
    // Revoke object URL to avoid memory leaks
    if (newFiles[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(newFiles[index].url);
    }
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium text-muted-foreground">
            {isDragActive ? (
              <span>Drop the files here</span>
            ) : (
              <span>Drag & drop files here, or click to select</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground/75">
            Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
          </div>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid gap-2">
          {value.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;