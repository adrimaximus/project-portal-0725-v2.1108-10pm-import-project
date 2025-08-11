import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectStatus, PaymentStatus } from "../types";

export const fetchDashboardProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects');
  
  if (error) {
    console.error("Error fetching dashboard projects:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    status: p.status as ProjectStatus,
    progress: p.progress,
    budget: p.budget,
    startDate: p.start_date,
    dueDate: p.due_date,
    paymentStatus: p.payment_status as PaymentStatus,
    createdBy: p.created_by,
    assignedTo: p.assignedTo || [],
    tasks: p.tasks || [],
    comments: p.comments || [],
  }));
};