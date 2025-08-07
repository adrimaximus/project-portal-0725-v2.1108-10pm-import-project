export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'In Progress' | 'Requested' | 'Done' | 'Cancelled' | 'Billed';

export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  initials: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  assignedTo: AssignedUser[];
  lastUpdated: string;
  tasks?: any[];
}