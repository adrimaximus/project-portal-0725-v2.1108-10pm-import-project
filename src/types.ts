export type GlobalRole = 'Admin' | 'Member';
export type ProjectRole = 'Project Owner' | 'Client' | 'Assignee' | 'Custom';

export type Role = 'Admin' | 'Member' | 'Client' | 'Comment Only' | 'View Only';

export type Collaborator = {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
};