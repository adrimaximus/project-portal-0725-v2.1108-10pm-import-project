import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Eye, Download, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import FileIcon from '../FileIcon';

// Define the shape of files that can be handled
export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
  // For raw File objects, these might not exist yet, but we normalize them
}

interface FileUploaderProps {
  value: UploadedFile[] | File[]; // Can be existing files from DB or new File objects
  onChange: (files: any[]) => void;
  bucket: string;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  onFileProcessed?: (file: UploadedFile) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileUploader = ({ 
  value = [], 
  onChange, 
  bucket, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  disabled = false,
  onFileProcessed
}: FileUploaderProps) => {
  // Normalize value to always have a consistent shape for rendering
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    // Map input value to displayable format
    const normalized = (value || []).map((file: any) => {
      if (file instanceof File) {
        return {
          originalFile: file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // Create preview URL for new files
          isNew: true
        };
      }
      return {
        ...file,
        isNew: false
      };
    });
    setFileList(normalized);
  }, [value]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Combine existing files with new ones, up to maxFiles
    const currentFiles = value || [];
    const availableSlots = maxFiles - currentFiles.length;
    const filesToAdd = acceptedFiles.slice(0, availableSlots);
    
    if (filesToAdd.length > 0) {
      const newFileList = [...currentFiles, ...filesToAdd];
      onChange(newFileList);

      // Notify parent about new files for processing (e.g. AI extraction)
      if (onFileProcessed) {
        filesToAdd.forEach(file => {
           // Create a temporary UploadedFile shape for processing
           onFileProcessed({
               name: file.name,
               url: URL.createObjectURL(file),
               size: file.size,
               type: file.type,
               storagePath: '' // Not stored yet
           });
        });
      }
    }
  }, [value, maxFiles, onChange, onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    maxFiles,
    maxSize,
    accept,
    disabled
  });

  const removeFile = (indexToRemove: number) => {
    const newFiles = (value || []).filter((_, index) => index !== indexToRemove);
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
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadCloud className="h-8 w-8" />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">Drag 'n' drop files here, or click to select</p>
              <p className="text-xs">Max {maxFiles} files, up to {formatBytes(maxSize)} each</p>
            </div>
          )}
        </div>
      </div>
      
      {fileList.length > 0 && (
        <div className="space-y-2">
          {fileList.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-card">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {file.type?.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileIcon fileType={file.type} className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {file.url && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(file.url, '_blank')}>
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => removeFile(index)} disabled={disabled}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;