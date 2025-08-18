export interface User {
  id: string;
  // other user properties
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  isNew?: boolean;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: string;
  payment_due_date: string;
  created_by: any; 
  assignedTo: any[];
  tasks: any[];
  comments: any[];
  services: string[];
  briefFiles: any[];
}