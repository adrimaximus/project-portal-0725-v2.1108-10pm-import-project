import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection, Accept } from 'react-dropzone';
import { UploadCloud, X, FileText, Trash2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatBytes } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

interface FileUploaderProps {
  bucket: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Accept;
  disabled?: boolean;
  label?: string;
  onFileProcessed?: (file: UploadedFile) => void;
}

const FileUploader = ({
  bucket,
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
  },
  disabled = false,
  label = "Drag & drop files here, or click to select",
  onFileProcessed,
}: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (disabled) return;

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        if (errors[0]?.code === 'file-too-large') {
          toast.error(`File ${file.name} is too large. Max size is ${formatBytes(maxSize)}`);
        } else if (errors[0]?.code === 'file-invalid-type') {
          toast.error(`File ${file.name} has an invalid type.`);
        } else {
          toast.error(`Could not upload ${file.name}: ${errors[0]?.message}`);
        }
      });
    }

    if (acceptedFiles.length === 0) return;

    if (value.length + acceptedFiles.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    setIsUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        const uploadedFile: UploadedFile = {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
          storagePath: filePath,
        };

        newUploadedFiles.push(uploadedFile);
        
        // Trigger the callback for AI processing if provided
        if (onFileProcessed) {
          onFileProcessed(uploadedFile);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`, { description: error.message });
      }
    }

    if (newUploadedFiles.length > 0) {
      onChange([...value, ...newUploadedFiles]);
      toast.success(`Successfully uploaded ${newUploadedFiles.length} file(s).`);
    }
    
    setIsUploading(false);
  }, [bucket, value, maxFiles, maxSize, onChange, disabled, onFileProcessed]);

  const removeFile = async (index: number) => {
    if (disabled) return;
    
    const fileToRemove = value[index];
    const newFiles = value.filter((_, i) => i !== index);
    
    // Optimistically update UI
    onChange(newFiles);

    // Try to delete from storage
    if (fileToRemove.storagePath) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileToRemove.storagePath]);
      
      if (error) {
        console.error('Delete error:', error);
        // We don't revert the UI update as the reference is gone from the form anyway
        toast.error("Failed to delete file from storage, but removed from list.");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept,
    disabled: disabled || isUploading || value.length >= maxFiles,
  });

  return (
    <div className="space-y-4">
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
            <p className="text-sm font-medium">{isUploading ? "Uploading..." : label}</p>
            <p className="text-xs">Max size: {formatBytes(maxSize)}</p>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-md border bg-background group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 h-8 w-8 bg-muted rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(file.url, '_blank')}
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeFile(index)}
                  disabled={disabled || isUploading}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
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