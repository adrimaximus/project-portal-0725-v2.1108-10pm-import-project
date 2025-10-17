import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import ProjectAdvancedFilters, { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';
import { Project } from '@/types';

// A placeholder for the project list component
const ProjectList = ({ projects }: { projects: Project[] }) => (
  <div className="grid gap-4">
    {projects.length > 0 ? (
      projects.map(project => (
        <div key={project.id} className="p-4 border rounded-lg">
          <h3 className="font-bold">{project.name}</h3>
          <p>Status: {project.status}</p>
        </div>
      ))
    ) : (
      <p>No projects match the current filters.</p>
    )}
  </div>
);

const ProjectsPage = () => {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allPeople, setAllPeople] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdvancedFiltersState>({
    hiddenStatuses: [],
    selectedPeopleIds: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase.rpc('get_dashboard_projects', { p_limit: 50, p_offset: 0 });
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      } else {
        setProjects(projectsData || []);
      }

      // Fetch people for filter dropdown
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, full_name');
      if (peopleError) {
        console.error('Error fetching people:', peopleError);
      } else {
        setAllPeople(peopleData.map(p => ({ id: p.id, name: p.full_name })) || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Load filters from user profile on mount
    const loadFilters = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('project_filters')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading filters:', error);
        } else if (data?.project_filters) {
          const savedFilters = data.project_filters as AdvancedFiltersState;
          // Basic validation
          if (savedFilters.hiddenStatuses && savedFilters.selectedPeopleIds) {
            setFilters(savedFilters);
          }
        }
      }
    };
    if (user) {
      loadFilters();
    }
  }, [user]);

  const handleFiltersChange = async (newFilters: AdvancedFiltersState) => {
    setFilters(newFilters);
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ project_filters: newFilters })
        .eq('id', user.id);
      if (error) {
        console.error('Error saving filters:', error);
      }
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Status filter
      if (filters.hiddenStatuses.includes(project.status)) {
        return false;
      }
      // People filter
      if (filters.selectedPeopleIds.length > 0) {
        const projectMemberIds = project.assignedTo.map((member: any) => member.id);
        const hasSelectedPerson = filters.selectedPeopleIds.some(id => projectMemberIds.includes(id));
        if (!hasSelectedPerson) {
          return false;
        }
      }
      return true;
    });
  }, [projects, filters]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <ProjectAdvancedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          allPeople={allPeople}
        />
      </div>
      {loading ? <p>Loading projects...</p> : <ProjectList projects={filteredProjects} />}
    </div>
  );
};

export default ProjectsPage;