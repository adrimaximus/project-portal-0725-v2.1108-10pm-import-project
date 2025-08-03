export type Role = 'Admin' | 'Member' | 'Client' | 'Comment Only' | 'View Only';

export type Collaborator = {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
};