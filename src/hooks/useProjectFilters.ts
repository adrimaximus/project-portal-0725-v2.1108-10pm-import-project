import { useState, useMemo, useCallback } from 'react';
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
        if (!dateRange || !dateRange.from) return true;
        if (!projectStart) return false;
        const filterStart = dateRange.from;
        const filterEnd = dateRange.to || dateRange.from;
        const effectiveProjectEnd = projectEnd && projectEnd < projectStart ? projectStart : (projectEnd || projectStart);
        return projectStart <= filterEnd && effectiveProjectEnd >= filterStart;
      })();

      const matchesOwner = (advancedFilters.ownerIds?.length || 0) === 0 ||
        (project.created_by && advancedFilters.ownerIds.includes(project.created_by.id));

      const matchesMember = (advancedFilters.memberIds?.length || 0) === 0 ||
        (project.assignedTo && project.assignedTo.some(person => 
          advancedFilters.memberIds.includes(person.id)
        ));

      const matchesStatus = (advancedFilters.excludedStatus?.length || 0) === 0 ||
        !advancedFilters.excludedStatus.includes(project.status);

      return matchesDate && matchesOwner && matchesMember && matchesStatus;
    });
  }, [projects, dateRange, advancedFilters]);

  const sortedProjects = useMemo(() => {
    let sortableItems = [...filteredProjects];
    const tieBreaker = (a: Project, b: Project) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue == null && bValue != null) return 1;
        if (aValue != null && bValue == null) return -1;
        if (aValue == null && bValue == null) return tieBreaker(a, b);

        let compareResult = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          compareResult = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          compareResult = aValue.getTime() - bValue.getTime();
        } else {
          compareResult = String(aValue).localeCompare(String(bValue));
        }

        if (compareResult !== 0) {
          return sortConfig.direction === 'ascending' ? compareResult : -compareResult;
        }

        return tieBreaker(a, b);
      });
    } else {
      // Default sorting logic
      const today = startOfToday();
      
      const projectsWithDates = sortableItems.filter(p => p.start_date);
      const projectsWithoutDates = sortableItems.filter(p => !p.start_date);

      const upcomingProjects = projectsWithDates
        .filter(p => !isBefore(new Date(p.start_date!), today))
        .sort((a, b) => {
          const dateCompare = new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime();
          return dateCompare !== 0 ? dateCompare : tieBreaker(a, b);
        });

      const pastProjects = projectsWithDates
        .filter(p => isBefore(new Date(p.start_date!), today))
        .sort((a, b) => {
          const dateCompare = new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime();
          return dateCompare !== 0 ? dateCompare : tieBreaker(a, b);
        });

      sortableItems = [...upcomingProjects, ...pastProjects, ...projectsWithoutDates];
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  const requestSort = useCallback((key: keyof Project) => {
    setSortConfig(prevConfig => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);

  return {
    dateRange,
    setDateRange,
    sortConfig,
    requestSort,
    sortedProjects,
  };
};