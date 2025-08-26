import { useState, useMemo } from 'react';
import { Project } from '@/types';
import { DateRange } from 'react-day-picker';
import { formatInJakarta } from '@/lib/utils';

export const useProjectFilters = (projects: Project[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: 'ascending' | 'descending' }>({ key: 'start_date', direction: 'descending' });

  const requestSort = (key: keyof Project) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter(project => {
        if (!project.start_date && !project.due_date) return false;
        
        const projectStart = project.start_date ? new Date(project.start_date) : null;
        const projectEnd = project.due_date ? new Date(project.due_date) : projectStart;

        if (projectStart && projectEnd) return projectStart <= toDate && projectEnd >= fromDate;
        if (projectStart) return projectStart >= fromDate && projectStart <= toDate;
        if (projectEnd) return projectEnd >= fromDate && projectEnd <= toDate;

        return false;
      });
    }

    if (searchTerm.trim() !== "") {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(lowercasedFilter) ||
        (project.description && project.description.toLowerCase().includes(lowercasedFilter))
      );
    }

    return filtered;
  }, [projects, dateRange, searchTerm]);

  const sortedProjects = useMemo(() => {
    let sortableItems = [...filteredProjects];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (sortConfig.key === 'start_date' || sortConfig.key === 'due_date') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else {
            const stringA = String(aValue).toLowerCase();
            const stringB = String(bValue).toLowerCase();
            if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

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