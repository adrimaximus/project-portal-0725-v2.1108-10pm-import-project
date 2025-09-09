import { Person } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';

interface PersonProjectsTabProps {
  projects: Person['projects'];
}

const PersonProjectsTab = ({ projects }: PersonProjectsTabProps) => {
  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          This person is not associated with any projects yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {projects.map(project => (
            <Link key={project.id} to={`/projects/${project.slug}`} className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">{project.name}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonProjectsTab;