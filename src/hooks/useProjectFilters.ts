import { useState, useMemo } from 'react';
import { Project } from '@/types';
import { DateRange } from 'react-day-picker';
import { isBefore, startOfToday } from 'date-fns';
import { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';

export const useProjectFilters = (projects: Project[], advancedFilters: AdvancedFiltersState) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
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

      const matchesMultiPerson = !advancedFilters.showOnlyMultiPerson || (project.assignedTo && project.assignedTo.length > 1);
      const isHiddenByStatus = advancedFilters.hiddenStatuses.includes(project.status);

      return matchesDate && matchesMultiPerson && !isHiddenByStatus;
    });
  }, [projects, dateRange, advancedFilters]);

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
    } else {
      // Default sorting logic
      const today = startOfToday();
      
      const projectsWithDates = sortableItems.filter(p => p.start_date);
      const projectsWithoutDates = sortableItems.filter(p => !p.start_date);

      const upcomingProjects = projectsWithDates
        .filter(p => !isBefore(new Date(p.start_date!), today))
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

      const pastProjects = projectsWithDates
        .filter(p => isBefore(new Date(p.start_date!), today))
        .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());

      sortableItems = [...upcomingProjects, ...pastProjects, ...projectsWithoutDates];
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
    dateRange,
    setDateRange,
    sortConfig,
    requestSort,
    sortedProjects,
  };
};