import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Project, AdvancedFiltersState } from '@/types';
import { DateRange } from 'react-day-picker';
import { isBefore, startOfToday, parseISO } from 'date-fns';
import SafeLocalStorage from '@/lib/localStorage';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const PROJECTS_VIEW_MODE_KEY = 'projects_view_mode';
const PROJECTS_HIDE_COMPLETED_KEY = 'projects_hide_completed';
const PROJECTS_KANBAN_GROUPBY_KEY = 'projects_kanban_groupby';
const PROJECTS_ADVANCED_FILTERS_KEY = 'projects_advanced_filters';

export const useProjectFilters = (projects: Project[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State derived from URL or localStorage ---
  const view = (searchParams.get('view') as ViewMode) || (SafeLocalStorage.getItem(PROJECTS_VIEW_MODE_KEY, 'list') as ViewMode);
  const searchTerm = searchParams.get('search') || '';
  const kanbanGroupBy = (searchParams.get('groupBy') as 'status' | 'payment_status') || (SafeLocalStorage.getItem(PROJECTS_KANBAN_GROUPBY_KEY, 'status') as 'status' | 'payment_status');
  const hideCompletedTasks = searchParams.has('hideCompleted') ? searchParams.get('hideCompleted') === 'true' : SafeLocalStorage.getItem(PROJECTS_HIDE_COMPLETED_KEY, false);
  
  const advancedFilters: AdvancedFiltersState = useMemo(() => {
    const fromUrl = {
      ownerIds: searchParams.getAll('owner'),
      memberIds: searchParams.getAll('member'),
      excludedStatus: searchParams.getAll('excludeStatus'),
    };
    if (fromUrl.ownerIds.length > 0 || fromUrl.memberIds.length > 0 || fromUrl.excludedStatus.length > 0) {
      return fromUrl;
    }
    return SafeLocalStorage.getItem(PROJECTS_ADVANCED_FILTERS_KEY, { ownerIds: [], memberIds: [], excludedStatus: [] });
  }, [searchParams]);

  const dateRange = useMemo(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam) {
      try {
        return { from: parseISO(fromParam), to: toParam ? parseISO(toParam) : undefined };
      } catch (e) { console.warn("Invalid date in URL", e); }
    }
    return undefined;
  }, [searchParams]);

  const sortConfig = useMemo(() => ({
    key: searchParams.get('sortKey') as keyof Project | null,
    direction: (searchParams.get('sortDir') as 'asc' | 'desc') || 'asc',
  }), [searchParams]);

  // --- Setter functions that update URL and localStorage ---
  const updateSearchParams = useCallback((updates: Record<string, string | string[] | null | boolean>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      newSearchParams.delete(key);
      if (value !== null && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          value.forEach(v => newSearchParams.append(key, v));
        } else {
          newSearchParams.set(key, String(value));
        }
      }
    });
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      updateSearchParams({ view: newView });
      SafeLocalStorage.setItem(PROJECTS_VIEW_MODE_KEY, newView);
    }
  };
  const handleSearchChange = (term: string) => updateSearchParams({ search: term });
  const setKanbanGroupBy = (value: 'status' | 'payment_status') => {
    updateSearchParams({ groupBy: value });
    SafeLocalStorage.setItem(PROJECTS_KANBAN_GROUPBY_KEY, value);
  };
  const toggleHideCompleted = () => {
    const newHide = !hideCompletedTasks;
    updateSearchParams({ hideCompleted: newHide });
    SafeLocalStorage.setItem(PROJECTS_HIDE_COMPLETED_KEY, newHide);
  };
  const handleAdvancedFiltersChange = useCallback((filters: AdvancedFiltersState) => {
    updateSearchParams({
      owner: filters.ownerIds,
      member: filters.memberIds,
      excludeStatus: filters.excludedStatus,
    });
    SafeLocalStorage.setItem(PROJECTS_ADVANCED_FILTERS_KEY, filters);
  }, [updateSearchParams]);
  const setDateRange = (range: DateRange | undefined) => {
    updateSearchParams({
      from: range?.from ? range.from.toISOString().split('T')[0] : null,
      to: range?.to ? range.to.toISOString().split('T')[0] : null,
    });
  };
  
  const requestSort = (key: keyof Project) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = 'asc';
      }
    }
    
    updateSearchParams({
      sortKey: key,
      sortDir: newDirection,
    });
  };

  const clearFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    newSearchParams.delete('from');
    newSearchParams.delete('to');
    newSearchParams.delete('owner');
    newSearchParams.delete('member');
    newSearchParams.delete('excludeStatus');
    setSearchParams(newSearchParams, { replace: true });
    SafeLocalStorage.removeItem(PROJECTS_ADVANCED_FILTERS_KEY);
  }, [searchParams, setSearchParams]);

  // --- Filtering and Sorting Logic ---
  const sortedProjects = useMemo(() => {
    let sortableItems = [...projects].filter(project => {
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
      
      const matchesSearch = (() => {
        if (!searchTerm) return true;
        const lowercasedFilter = searchTerm.toLowerCase();
        return (
            (project.name && project.name.toLowerCase().includes(lowercasedFilter)) ||
            (project.description && project.description.toLowerCase().includes(lowercasedFilter)) ||
            (project.client_name && project.client_name.toLowerCase().includes(lowercasedFilter)) ||
            (project.client_company_name && project.client_company_name.toLowerCase().includes(lowercasedFilter))
        );
      })();

      return matchesDate && matchesOwner && matchesMember && matchesStatus && matchesSearch;
    });

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
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            // Check for ISO date string format
            const dateA = Date.parse(aValue);
            const dateB = Date.parse(bValue);
            
            if (!isNaN(dateA) && !isNaN(dateB) && aValue.includes('-')) {
                 compareResult = dateA - dateB;
            } else {
                 compareResult = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
            }
        } else {
           compareResult = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
        }

        if (compareResult !== 0) {
          return sortConfig.direction === 'asc' ? compareResult : -compareResult;
        }

        return tieBreaker(a, b);
      });
    } else {
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
  }, [projects, dateRange, advancedFilters, sortConfig, searchTerm]);

  return {
    view, handleViewChange,
    kanbanGroupBy, setKanbanGroupBy,
    hideCompletedTasks, toggleHideCompleted,
    searchTerm, handleSearchChange,
    advancedFilters, handleAdvancedFiltersChange,
    dateRange, setDateRange,
    sortConfig, requestSort,
    sortedProjects,
    clearFilters,
  };
};