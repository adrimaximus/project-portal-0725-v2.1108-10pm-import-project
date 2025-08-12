import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/data/projects';
import { toast } from 'sonner';

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
  "assignedTo": Project['assignedTo']; 
  tasks: Project['tasks'];
  comments: Project['comments'];
  services: Project['services'];
  "briefFiles": Project['briefFiles'];
}

const fetchProjects = async (): Promise<Project[]> => {
  const batchSize = 10;
  let offset = 0;
  let allData: ProjectFromRpc[] = [];
  
  while (true) {
    // Panggil RPC dengan parameter paginasi
    const { data, error } = await supabase
      .rpc('get_dashboard_projects', { p_limit: batchSize, p_offset: offset });
      
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects.');
      throw new Error(error.message);
    }
    
    if (data) {
      allData = allData.concat(data as ProjectFromRpc[]);
      if ((data as any[]).length < batchSize) {
        break; // Halaman terakhir
      }
      offset += batchSize;
    } else {
      break; // Tidak ada data yang dikembalikan
    }
  }

  const projects: Project[] = allData.map(p => ({
    ...p,
    startDate: p.start_date,
    dueDate: p.due_date,
    paymentStatus: p.payment_status,
    paymentDueDate: p.payment_due_date,
    createdBy: p.created_by,
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