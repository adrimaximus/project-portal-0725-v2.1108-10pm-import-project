import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/data/projects';
import { toast } from 'sonner';

// Ini adalah tipe data yang dikembalikan oleh fungsi RPC, dengan properti snake_case
interface ProjectFromRpc {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: Project['status'];
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: Project['paymentStatus'];
  payment_due_date?: string;
  created_by: Project['createdBy'];
  // Kunci ini peka huruf besar/kecil karena dikutip dalam fungsi SQL
  "assignedTo": Project['assignedTo']; 
  tasks: Project['tasks'];
  comments: Project['comments'];
  services: Project['services'];
  "briefFiles": Project['briefFiles'];
}

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects');

  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.', {
      description: error.message,
    });
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  // RPC mengembalikan snake_case, tetapi aplikasi menggunakan camelCase. Mari kita petakan datanya.
  const projects: Project[] = (data as any[]).map(p => ({
    ...p,
    startDate: p.start_date,
    dueDate: p.due_date,
    paymentStatus: p.payment_status,
    paymentDueDate: p.payment_due_date,
    createdBy: p.created_by,
    // Gunakan notasi kurung siku untuk kunci yang peka huruf besar/kecil
    assignedTo: p.assignedTo || [],
    tasks: p.tasks || [],
    comments: p.comments || [],
    services: p.services || [],
    briefFiles: p.briefFiles || [],
  }));

  return projects;
};

export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
};