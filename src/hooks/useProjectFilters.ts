import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Project, AdvancedFiltersState } from '@/types';
import { DateRange } from 'react-day-picker';
import { isBefore, startOfToday, parseISO } from 'date-fns';
import SafeLocalStorage from '@/lib/localStorage';

const FILTERS_STORAGE_KEY = 'projectFilters';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

export const useProjectFilters = (projects: Project[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialState = () => {
    const storedFilters = SafeLocalStorage.getItem<any>(FILTERS_STORAGE_KEY, {});
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    let dateRange;
    if (fromParam) {
      try {
        dateRange = { from: parseISO(fromParam), to: toParam ? parseISO(toParam) : undefined };
      } catch (e) {
        console.warn("Invalid date in URL, ignoring.", e);
      }
    } else if (storedFilters.dateRange?.from) {
      try {
        dateRange = { from: new Date(storedFilters.dateRange.from), to: storedFilters.dateRange.to ? new Date(storedFilters.dateRange.to) : undefined };
      } catch (e) {
        console.warn("Invalid date in localStorage, ignoring.", e);
      }
    }

    return {
      view: (searchParams.get('view') as ViewMode) || storedFilters.view || 'list',
      searchTerm: searchParams.get('search') || storedFilters.searchTerm || '',
      kanbanGroupBy: (searchParams.get('groupBy') as 'status' | 'payment_status') || storedFilters.kanbanGroupBy || 'status',
      hideCompletedTasks: searchParams.get('hideCompleted') ? searchParams.get('hideCompleted') === 'true' : (storedFilters.hideCompletedTasks ?? true),
      advancedFilters: {
        ownerIds: searchParams.getAll('owner').length > 0 ? searchParams.getAll('owner') : (storedFilters.advancedFilters?.ownerIds ?? []),
        memberIds: searchParams.getAll('member').length > 0 ? searchParams.getAll('member') : (storedFilters.advancedFilters?.memberIds ?? []),
        excludedStatus: searchParams.getAll('excludeStatus').length > 0 ? searchParams.getAll('excludeStatus') : (storedFilters.advancedFilters?.excludedStatus ?? []),
      },
      dateRange,
      sortConfig: {
        key: searchParams.get('sortKey') || storedFilters.sortConfig?.key || null,
        direction: (searchParams.get('sortDir') as 'asc' | 'desc') || storedFilters.sortConfig?.direction || 'asc',
      },
    };
  };

  const [view, setView] = useState<ViewMode>(getInitialState().view);
  const [searchTerm, setSearchTerm] = useState(getInitialState().searchTerm);
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>(getInitialState().kanbanGroupBy);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(getInitialState().hideCompletedTasks);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(getInitialState().advancedFilters);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getInitialState().dateRange);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: 'asc' | 'desc' }>(getInitialState().sortConfig);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('view', view);
    if (searchTerm) newSearchParams.set('search', searchTerm);
    if (view === 'kanban') newSearchParams.set('groupBy', kanbanGroupBy);
    if (view === 'tasks' || view === 'tasks-kanban') newSearchParams.set('hideCompleted', String(hideCompletedTasks));
    
    advancedFilters.ownerIds.forEach(id => newSearchParams.append('owner', id));
    advancedFilters.memberIds.forEach(id => newSearchParams.append('member', id));
    advancedFilters.excludedStatus.forEach(status => newSearchParams.append('excludeStatus', status));

    if (dateRange?.from) newSearchParams.set('from', dateRange.from.toISOString().split('T')[0]);
    if (dateRange?.to) newSearchParams.set('to', dateRange.to.toISOString().split('T')[0]);

    if (sortConfig.key) {
      newSearchParams.set('sortKey', sortConfig.key);
      newSearchParams.set('sortDir', sortConfig.direction);
    }

    setSearchParams(newSearchParams, { replace: true });

    SafeLocalStorage.setItem(FILTERS_STORAGE_KEY, {
      view, searchTerm, kanbanGroupBy, hideCompletedTasks, advancedFilters, dateRange, sortConfig
    });
  }, [view, searchTerm, kanbanGroupBy, hideCompletedTasks, advancedFilters, dateRange, sortConfig, setSearchParams]);

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) setView(newView);
  };

  const handleSearchChange = (term: string) => setSearchTerm(term);
  const toggleHideCompleted = () => setHideCompletedTasks(prev => !prev);

  const requestSort = useCallback((key: keyof Project) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

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

      return matchesDate && matchesOwner && matchesMember && matchesStatus;
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
        } else {
          compareResult = String(aValue).localeCompare(String(bValue));
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
  }, [projects, dateRange, advancedFilters, sortConfig]);

  return {
    view, handleViewChange,
    kanbanGroupBy, setKanbanGroupBy,
    hideCompletedTasks, toggleHideCompleted,
    searchTerm, handleSearchChange,
    advancedFilters, handleAdvancedFiltersChange: setAdvancedFilters,
    dateRange, setDateRange,
    sortConfig, requestSort,
    sortedProjects,
  };
};