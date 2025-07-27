export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
  status?: 'online' | 'offline';
}