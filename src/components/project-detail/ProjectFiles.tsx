import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDropzone } from 'react-dropzone';
import { Project } from "@/data/projects";
import { UploadCloud, MoreVertical, Download, Trash2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { FileIcon } from "@/components/FileIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProjectFilesProps {
  project: Project;
  onFilesDrop: (files: File[]) => void;
}

const ProjectFiles = ({ project, onFilesDrop }: ProjectFilesProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onFilesDrop });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Files</CardTitle>
        <Button {...getRootProps()} variant="outline" size="sm">
          <input {...getInputProps()} />
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        <div {...getRootProps({ className: `p-6 border-2 border-dashed rounded-lg text-center ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}` })}>
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? "Drop the files here ..." : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
        <div className="mt-6 space-y-2">
          {project.files?.map(file => (
            <div key={file.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
              <FileIcon fileName={file.name} className="h-8 w-8 text-gray-500 flex-shrink-0" />
              <div className="ml-3 flex-1 min-w-0">
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-gray-800 hover:underline truncate block">{file.name}</a>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFiles;