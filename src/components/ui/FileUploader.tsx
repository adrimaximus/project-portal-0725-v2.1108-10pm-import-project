"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

interface FileUploaderProps {
  bucket: string;
  value: FileMetadata[];
  onChange: (files: FileMetadata[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  onFileProcessed?: (file: FileMetadata) => void; // New callback for processing after upload
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader = ({
  bucket,
  value = [],
  onChange,
  maxFiles = 1,
  maxSize = 10485760, // 10MB
  accept = { 'image/*': [], 'application/pdf': ['.pdf'] },
  disabled = false,
  onFileProcessed,
}: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return;
    if (acceptedFiles.length === 0) return;

    const filesToUpload = acceptedFiles.slice(0, maxFiles - value.length);

    if (filesToUpload.length === 0) {
      toast.warning(`Maximum of ${maxFiles} files already uploaded.`);
      return;
    }

    setIsUploading(true);
    const newFiles: FileMetadata[] = [...value];
    let processedFile: FileMetadata | null = null;

    for (const file of filesToUpload) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds the maximum size of ${formatFileSize(maxSize)}.`);
        continue;
      }

      const filePath = `${bucket}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      try {
        const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

        const uploadedFile: FileMetadata = {
          name: file.name,
          url: publicUrlData.publicUrl,
          size: file.size,
          type: file.type,
          storagePath: data.path,
        };

        newFiles.push(uploadedFile);
        toast.success(`File ${file.name} uploaded.`);
        
        // Trigger callback for processing
        if (onFileProcessed) {
            processedFile = uploadedFile;
        }

      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}.`, { description: error.message });
      }
    }

    onChange(newFiles);
    setIsUploading(false);
    
    // Run processing callback after all uploads are complete
    if (processedFile && onFileProcessed) {
        onFileProcessed(processedFile);
    }

  }, [bucket, maxFiles, maxSize, value, onChange, disabled, isUploading, onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - value.length,
    disabled: disabled || isUploading || value.length >= maxFiles,
  });

  const handleRemove = async (fileToRemove: FileMetadata) => {
    if (disabled) return;
    try {
      // Delete from storage
      const { error } = await supabase.storage.from(bucket).remove([fileToRemove.storagePath]);
      if (error) {
        // Log error but proceed with UI removal if storage deletion fails
        console.error('Failed to delete file from storage:', error);
        toast.warning('Failed to delete file from storage, but removing from list.');
      } else {
        toast.success('File removed successfully.');
      }
      
      // Remove from state
      onChange(value.filter(f => f.storagePath !== fileToRemove.storagePath));
    } catch (error: any) {
      toast.error('Error removing file.', { description: error.message });
    }
  };

  const handleDownload = (url: string, name: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary/50",
            isDragActive && "border-primary bg-primary/5",
            (disabled || isUploading || value.length >= maxFiles) && "opacity-50 cursor-not-allowed hover:border-dashed"
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-2 text-sm text-primary">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag 'n' drop files here, or click to select files
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Max {maxFiles} file(s), up to {formatFileSize(maxSize)} each.
              </p>
            </div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-background">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.url, file.name)}>
                    <Download className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(file)} disabled={disabled}>
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