import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from './progress';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath?: string;
  originalFile?: File; 
}

export interface ProcessingFileState {
  progress: number;
  label?: string;
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
  processingFiles?: Record<string, ProcessingFileState>;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  bucket = 'default',
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  disabled = false,
  onFileProcessed,
  processingFiles
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
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

    if (value.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload a maximum of ${maxFiles} files.`);
        return;
    }

    // Initialize uploading state
    const newUploads = acceptedFiles.map(f => ({ name: f.name, progress: 0 }));
    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Process uploads
    const uploadPromises = acceptedFiles.map(async (file) => {
        const sanitizeName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, '_');
        const fileName = `${Date.now()}-${sanitizeName}`;
        const filePath = fileName;

        // Simulate progress (Supabase JS client doesn't expose XHR progress yet)
        const interval = setInterval(() => {
            setUploadingFiles(prev => prev.map(u => 
                u.name === file.name ? { ...u, progress: Math.min(u.progress + 10, 90) } : u
            ));
        }, 100);

        try {
            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            // Complete progress
            clearInterval(interval);
            setUploadingFiles(prev => prev.map(u => 
                u.name === file.name ? { ...u, progress: 100 } : u
            ));

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            return {
                name: file.name,
                url: publicUrl,
                size: file.size,
                type: file.type,
                storagePath: filePath,
                originalFile: file
            };
        } catch (error: any) {
            clearInterval(interval);
            console.error('Upload error:', error);
            toast.error(`Failed to upload ${file.name}`);
            return null;
        } finally {
            // Remove from uploading list after a moment
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter(u => u.name !== file.name));
            }, 500);
        }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((f): f is UploadedFile => f !== null);

    const updatedFiles = [...value, ...successfulUploads];
    onChange(updatedFiles);

    // Trigger processing for new files
    if (onFileProcessed) {
        successfulUploads.forEach(file => onFileProcessed(file));
    }

  }, [value, maxFiles, maxSize, onChange, onFileProcessed, disabled, bucket]);

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
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative overflow-hidden",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 relative z-10">
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

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="grid gap-2">
            {uploadingFiles.map((file, i) => (
                <div key={`uploading-${i}`} className="flex flex-col gap-1 p-3 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                        <span className="text-muted-foreground">{file.progress}%</span>
                    </div>
                    <Progress value={file.progress} className="h-1" />
                </div>
            ))}
        </div>
      )}

      {/* Uploaded Files List (with Processing Status) */}
      {value.length > 0 && (
        <div className="grid gap-2">
          {value.map((file, index) => {
            const processingState = processingFiles?.[file.name];
            
            return (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden relative">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    {/* Checkmark overlay for completed uploads/processing */}
                    {!processingState && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <CheckCircle2 className="h-4 w-4 text-green-500 fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col overflow-hidden w-full mr-2">
                    <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate hover:underline cursor-pointer">
                      {file.name}
                    </a>
                    
                    {processingState ? (
                      <div className="w-full space-y-1 mt-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                           <span>{processingState.label || 'Processing...'}</span>
                           <span>{Math.round(processingState.progress)}%</span>
                        </div>
                        <Progress value={processingState.progress} className="h-1" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeFile(index)}
                  disabled={disabled || !!processingState}
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