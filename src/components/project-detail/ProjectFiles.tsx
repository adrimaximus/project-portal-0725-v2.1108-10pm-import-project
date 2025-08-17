import { Project } from '@/types';
import { FileIcon } from 'lucide-react';

const ProjectFiles = ({ project }: { project: Project }) => {
  return (
    <div>
      <h3 className="font-bold mb-2">Files</h3>
      {project.briefFiles && project.briefFiles.length > 0 ? (
        <ul className="space-y-2">
          {project.briefFiles.map((file, index) => (
            <li key={index} className="flex items-center space-x-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {file.name}
              </a>
              <span className="text-sm text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No files attached.</p>
      )}
    </div>
  );
};

export default ProjectFiles;