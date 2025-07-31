import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { File as FileIcon, X } from 'lucide-react';
import { Button } from '../ui/button';

interface FileUploaderProps {
  onFilesUpload: (files: File[]) => void;
}

export function FileUploader({ onFilesUpload }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFilesUpload(newFiles);
  }, [files, onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (fileName: string) => {
    const newFiles = files.filter(file => file.name !== fileName);
    setFiles(newFiles);
    onFilesUpload(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex justify-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop the files here ...'
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.name)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}