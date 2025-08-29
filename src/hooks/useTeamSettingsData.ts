import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useRoles } from '@/hooks/useRoles';
import { useMemo } from 'react';

export const useTeamSettingsData = () => {
  const { data: members = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useTeamMembers();
  const { data: roles = [], isLoading: isLoadingRoles, refetch: refetchRoles } = useRoles();

  const validRoles = useMemo(() => roles.filter(r => r.name && r.name.trim() !== ''), [roles]);

  const fetchData = () => {
    refetchMembers();
    refetchRoles();
  };

  return {
    members,
    roles,
    validRoles,
    isLoading: isLoadingMembers || isLoadingRoles,
    fetchData,
  };
};