import { Button } from '@/components/ui/button';
import { Briefcase, FilterX, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectsEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  searchTerm: string;
}

const ProjectsEmptyState = ({ hasActiveFilters, onClearFilters, searchTerm }: ProjectsEmptyStateProps) => {
  if (hasActiveFilters || searchTerm) {
    return (
      <div className="text-center py-16">
        <FilterX className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Projects Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No projects match your current filters or search term.
        </p>
        <Button onClick={onClearFilters} className="mt-6">
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No Projects Yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating your first project.
      </p>
      <Button asChild className="mt-6">
        <Link to="/request">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Link>
      </Button>
    </div>
  );
};

export default ProjectsEmptyState;