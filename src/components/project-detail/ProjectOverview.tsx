import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectOverview = ({ project }: { project: Project }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{project.description}</p>
        <div className="mt-4">
          <p>Status: {project.status}</p>
          <p>Progress: {project.progress}%</p>
          {/* Perbaikan: Gunakan 'Offline' dengan huruf besar 'O' agar sesuai dengan definisi tipe */}
          <p>Created by: {project.createdBy.name} ({project.createdBy.status || 'Offline'})</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;