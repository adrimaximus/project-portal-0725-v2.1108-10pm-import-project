import { useState, useMemo, useCallback } from 'react';
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

export const useProjectFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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
  const handleAdvancedFiltersChange = (filters: AdvancedFiltersState) => {
    updateSearchParams({
      owner: filters.ownerIds,
      member: filters.memberIds,
      excludeStatus: filters.excludedStatus,
    });
    SafeLocalStorage.setItem(PROJECTS_ADVANCED_FILTERS_KEY, filters);
  };
  const setDateRange = (range: DateRange | undefined) => {
    updateSearchParams({
      from: range?.from ? range.from.toISOString().split('T')[0] : null,
      to: range?.to ? range.to.toISOString().split('T')[0] : null,
    });
  };
  const requestSort = (key: keyof Project) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
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

  return {
    view, handleViewChange,
    kanbanGroupBy, setKanbanGroupBy,
    hideCompletedTasks, toggleHideCompleted,
    searchTerm, handleSearchChange,
    advancedFilters, handleAdvancedFiltersChange,
    dateRange, setDateRange,
    sortConfig, requestSort,
    clearFilters,
  };
};