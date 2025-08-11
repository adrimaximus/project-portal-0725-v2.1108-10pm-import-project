import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectStatus, PaymentStatus, AssignedUser } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useDashboardData = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const errorToastShown = useRef(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      if (projects.length === 0) {
        setIsLoading(true);
      }

      const { data, error } = await supabase.rpc('get_dashboard_projects');

      if (error) {
        if (!errorToastShown.current) {
          toast.error("Gagal menyegarkan data proyek. Data yang ditampilkan mungkin sudah usang.");
          errorToastShown.current = true;
        }
        console.error(error);
        setIsLoading(false);
        return;
      }
      
      const mappedProjects: Project[] = data.map((p: any) => ({
        ...p,
        status: p.status as ProjectStatus,
        paymentStatus: p.payment_status as PaymentStatus,
        assignedTo: p.assignedTo || [],
        tasks: p.tasks || [],
        comments: p.comments || [],
        createdBy: p.created_by,
        startDate: p.start_date,
        dueDate: p.due_date,
      }));

      setProjects(mappedProjects);
      setIsLoading(false);
    };

    fetchProjects();
  }, [user]);

  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const projectStatusCounts = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const paymentStatusCounts = projects.reduce((acc, p) => {
        acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const ownerCounts = projects.reduce((acc, p) => {
        if (p.assignedTo.length > 0) {
            const owner = p.assignedTo[0];
            if (!acc[owner.id]) {
                acc[owner.id] = { ...owner, projectCount: 0 };
            }
            acc[owner.id].projectCount++;
        }
        return acc;
    }, {} as Record<string, any>);
    const topOwner = Object.values(ownerCounts).sort((a, b) => b.projectCount - a.projectCount)[0] || null;

    const collaboratorStats = projects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { ...user, projectCount: 0, taskCount: 0 };
            }
            acc[user.id].projectCount++;
        });
        return acc;
    }, {} as Record<string, any>);

    projects.forEach(p => {
        p.tasks?.forEach(task => {
            (task.assignedTo || []).forEach(user => {
                if (collaboratorStats[user.id]) {
                    collaboratorStats[user.id].taskCount++;
                }
            });
        });
    });
    const collaborators = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount);
    const topCollaborator = collaborators[0] || null;

    const userValueCounts = projects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { ...user, totalValue: 0 };
            }
            acc[user.id].totalValue += p.budget || 0;
        });
        return acc;
    }, {} as Record<string, any>);
    const topUserByValue = Object.values(userValueCounts).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

    const pendingPaymentCounts = projects
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((acc, p) => {
          p.assignedTo.forEach(user => {
              if (!acc[user.id]) {
                  acc[user.id] = { ...user, pendingValue: 0 };
              }
              acc[user.id].pendingValue += p.budget || 0;
          });
          return acc;
      }, {} as Record<string, any>);
    const topUserByPendingValue = Object.values(pendingPaymentCounts).sort((a, b) => b.pendingValue - a.pendingValue)[0] || null;

    return {
      totalValue,
      projectStatusCounts,
      paymentStatusCounts,
      topOwner,
      collaborators,
      topCollaborator,
      topUserByValue,
      topUserByPendingValue,
    };
  }, [projects]);

  return { projects, isLoading, stats };
};