export type Role = 'Admin' | 'Member' | 'Client' | 'Owner' | 'View Only' | 'Comment Only' | string;

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  online?: boolean;
  role?: Role;
}