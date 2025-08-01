import { Project } from '@/data/projects';

const ProjectFiles = ({ project }: { project: Project }) => {
  return (
    <div>
      <h3 className="font-bold">Files</h3>
      <ul>
        {project.briefFiles?.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectFiles;