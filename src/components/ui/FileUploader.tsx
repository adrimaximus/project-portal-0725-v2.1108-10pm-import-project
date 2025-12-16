import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Eye, Trash2, Loader2, File as FileIconLucide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  storagePath?: string;
  id?: string;
}

interface FileUploaderProps {
  value: (File | UploadedFile)[];
  onChange: (files: (File | UploadedFile)[]) => void;
  onFileProcessed?: (file: UploadedFile) => void;
  maxFiles?: number;
  maxSize?: number; // bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  bucket: string;
  label?: string;
}

const FileUploader = ({ 
  value = [], 
  onChange, 
  onFileProcessed,
  maxFiles = 5, 
  maxSize = 5 * 1024 * 1024, 
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'application/pdf': ['.pdf']
  },
  disabled = false,
  bucket,
  label
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;
    
    // Check total files count
    if (value.length + acceptedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} file(s).`);
      return;
    }

    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Max size is ${formatBytes(maxSize)}.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = [...value, ...validFiles];
      onChange(newFiles);
      
      // Auto-trigger analysis for the first new file if handler provided
      if (onFileProcessed && validFiles.length > 0) {
        // We handle the analysis in the parent component usually
        // But here we might want to simulate an "upload" object immediately for preview
        const file = validFiles[0];
        const previewUrl = URL.createObjectURL(file);
        onFileProcessed({
            name: file.name,
            url: previewUrl,
            type: file.type,
            size: file.size
        });
      }
    }
  }, [value, maxFiles, maxSize, onChange, onFileProcessed, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept,
    disabled: disabled || value.length >= maxFiles
  });

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const handleView = (file: File | UploadedFile) => {
    const url = 'url' in file ? file.url : URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed hover:border-muted-foreground/25"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <UploadCloud className="h-8 w-8" />
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <>
                <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs">
                  Supported: Images, PDF (Max {formatBytes(maxSize)})
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const isUploaded = 'url' in file;
            const fileName = isUploaded ? file.name : (file as File).name;
            const fileSize = isUploaded ? file.size : (file as File).size;
            const fileType = isUploaded ? file.type : (file as File).type;

            return (
              <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <FileIconLucide className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
                      {fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatBytes(fileSize)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(isUploaded || file instanceof File) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleView(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUploader;