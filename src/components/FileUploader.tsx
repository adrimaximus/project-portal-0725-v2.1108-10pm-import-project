"use client";

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Paperclip } from 'lucide-react';
import { Badge } from './ui/badge';

interface FileUploaderProps {
    onFilesChange: (files: File[]) => void;
}

const FileUploader = ({ onFilesChange }: FileUploaderProps) => {
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        const updatedFiles = files.filter(file => file.name !== fileName);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <div 
                className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={triggerFileSelect}
            >
                <Input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Paperclip className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop files here, or click to select files
                </p>
            </div>
            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Selected files:</h4>
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-2">
                                <span>{file.name}</span>
                                <button onClick={() => handleRemoveFile(file.name)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <X size={12} />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;