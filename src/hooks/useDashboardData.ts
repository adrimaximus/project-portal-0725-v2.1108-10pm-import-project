import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project, User } from '@/types';
import { toast } from 'sonner';

export const useDashboardData = () => {
  const { session, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session) {
        if (!authLoading) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_projects');

      if (error) {
        console.error('Error fetching dashboard projects:', error);
        toast.error('Failed to fetch projects. Please try again later.');
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchProjects();
    }
  }, [session, authLoading]);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalValue = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    const allUsers = projects.reduce((acc: User[], project) => {
      const members = [project.createdBy, ...project.assignedTo];
      members.forEach(member => {
        if (member && !acc.some(u => u.id === member.id)) {
          acc.push(member);
        }
      });
      return acc;
    }, []);

    const collaborators = projects.reduce((acc: User[], project) => {
      project.assignedTo?.forEach(member => {
        if (!acc.some(c => c.id === member.id)) {
          acc.push(member);
        }
      });
      return acc;
    }, []);

    const projectStatusCounts = projects.reduce((acc, p) => {
      const status = p.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentStatusCounts = projects.reduce((acc, p) => {
      const status = p.paymentStatus || 'Unpaid';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ownerCounts = projects.reduce((acc, p) => {
      if (p.createdBy?.id) {
        acc[p.createdBy.id] = (acc[p.createdBy.id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topOwnerId = Object.keys(ownerCounts).sort((a, b) => ownerCounts[b] - ownerCounts[a])[0];
    const topOwner = allUsers.find(u => u.id === topOwnerId) || null;

    const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
    const completedTasks = projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.completed).length || 0), 0);
    const totalTickets = projects.reduce((acc, p) => acc + (p.comments?.filter(c => (c as any).is_ticket).length || 0), 0);

    const collaboratorCounts = projects.reduce((acc, p) => {
        p.assignedTo?.forEach(member => {
            if (p.createdBy?.id !== member.id) {
                acc[member.id] = (acc[member.id] || 0) + 1;
            }
        });
        return acc;
    }, {} as Record<string, number>);

    const topCollaboratorId = Object.keys(collaboratorCounts).sort((a, b) => collaboratorCounts[b] - collaboratorCounts[a])[0];
    const topCollaborator = allUsers.find(u => u.id === topCollaboratorId) || null;

    const userValue = projects.reduce((acc, p) => {
        const projectValue = p.budget || 0;
        const members = [p.createdBy, ...p.assignedTo];
        members.forEach(member => {
            if (member?.id) {
                acc[member.id] = (acc[member.id] || 0) + projectValue;
            }
        });
        return acc;
    }, {} as Record<string, number>);

    const topUserByValueId = Object.keys(userValue).sort((a, b) => userValue[b] - userValue[a])[0];
    const topUserByValue = allUsers.find(u => u.id === topUserByValueId) || null;

    const userPendingValue = projects.reduce((acc, p) => {
        if (p.paymentStatus !== 'Paid') {
            const projectValue = p.budget || 0;
            const members = [p.createdBy, ...p.assignedTo];
            members.forEach(member => {
                if (member?.id) {
                    acc[member.id] = (acc[member.id] || 0) + projectValue;
                }
            });
        }
        return acc;
    }, {} as Record<string, number>);

    const topUserByPendingValueId = Object.keys(userPendingValue).sort((a, b) => userPendingValue[b] - userPendingValue[a])[0];
    const topUserByPendingValue = allUsers.find(u => u.id === topUserByPendingValueId) || null;

    return {
      totalProjects,
      totalValue,
      completedProjects,
      collaborators,
      projectStatusCounts,
      paymentStatusCounts,
      topOwner,
      totalTasks,
      completedTasks,
      totalTickets,
      topCollaborator,
      topUserByValue,
      topUserByPendingValue,
    };
  }, [projects]);

  return { projects, isLoading, stats };
};