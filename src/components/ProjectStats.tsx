import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ProjectStats = ({ project }: { project: Project }) => {
  const ticketCount = project.comments?.filter(c => c.is_ticket).length || 0;
  return (
    <Card>
      <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
      <CardContent>
        <p>Progress: {project.progress}%</p>
        <p>Tasks: {project.tasks?.length || 0}</p>
        <p>Tickets: {ticketCount}</p>
      </CardContent>
    </Card>
  );
};

export default ProjectStats;