export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status?: 'online' | 'offline';
}