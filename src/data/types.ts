export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  status: 'online' | 'offline';
}