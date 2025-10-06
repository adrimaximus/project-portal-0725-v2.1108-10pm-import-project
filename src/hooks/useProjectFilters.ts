import { useState, useMemo } from 'react';
import { Project } from '@/types';
import { DateRange } from 'react-day-picker';

export const useProjectFilters = (projects: Project[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: 'ascending' | 'descending' }>({ key: 'start_date', direction: 'ascending' });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(searchTermLower) ||
        (project.description && project.description.toLowerCase().includes(searchTermLower)) ||
        (project.category && project.category.toLowerCase().includes(searchTermLower));

      const projectStart = project.start_date ? new Date(project.start_date) : null;
      const projectEnd = project.due_date ? new Date(project.due_date) : projectStart;

      const matchesDate = (() => {
        if (!dateRange || !dateRange.from) {
          return true; // No date filter applied
        }

        if (!projectStart) {
          return false; // Project has no start date, cannot match a date filter
        }

        const filterStart = dateRange.from;
        const filterEnd = dateRange.to || dateRange.from; // Handle single day selection

        // Ensure project end is not before project start
        const effectiveProjectEnd = projectEnd && projectEnd < projectStart ? projectStart : (projectEnd || projectStart);

        // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
        return projectStart <= filterEnd && effectiveProjectEnd >= filterStart;
      })();

      return matchesSearch && matchesDate;
    });
  }, [projects, searchTerm, dateRange]);

  const sortedProjects = useMemo(() => {
    let sortableItems = [...filteredProjects];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  const requestSort = (key: keyof Project) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    sortConfig,
    requestSort,
    sortedProjects,
  };
};