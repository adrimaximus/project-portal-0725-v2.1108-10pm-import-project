export interface User {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export const allUsers: User[] = [
  { id: 'user-1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex', role: 'Lead Developer' },
  { id: 'user-2', name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=maria', role: 'UI/UX Designer' },
  { id: 'user-3', name: 'James Smith', avatar: 'https://i.pravatar.cc/150?u=james', role: 'Project Manager' },
  { id: 'user-4', name: 'Priya Patel', avatar: 'https://i.pravatar.cc/150?u=priya', role: 'QA Engineer' },
];