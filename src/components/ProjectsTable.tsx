import { Project } from '@/data/projects';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getStatusClass, getPaymentStatusClass } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ProjectsTableProps {
  projects: Project[];
}

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead>Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map(project => (
          <TableRow key={project.id}>
            <TableCell>
              <Link to={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                {project.name}
              </Link>
              <div className="text-sm text-muted-foreground">{project.category}</div>
            </TableCell>
            <TableCell>
              <Badge className={getStatusClass(project.status)}>{project.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={getPaymentStatusClass(project.paymentStatus)}>{project.paymentStatus}</Badge>
            </TableCell>
            <TableCell>${project.budget.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectsTable;