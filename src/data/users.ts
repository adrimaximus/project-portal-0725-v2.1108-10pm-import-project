export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
}

export const allUsers: User[] = [
  { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/01.png', role: 'Project Manager', email: 'alex.j@example.com' },
  { id: 'user-2', name: 'Samantha Green', avatar: '/avatars/02.png', role: 'Lead Designer', email: 'samantha.g@example.com' },
  { id: 'user-3', name: 'Michael Brown', avatar: '/avatars/03.png', role: 'Lead Developer', email: 'michael.b@example.com' },
  { id: 'user-4', name: 'Jessica Williams', avatar: '/avatars/04.png', role: 'Frontend Developer', email: 'jessica.w@example.com' },
  { id: 'user-5', name: 'Chris Davis', avatar: '/avatars/05.png', role: 'Backend Developer', email: 'chris.d@example.com' },
  { id: 'user-6', name: 'Emily White', avatar: '/avatars/06.png', role: 'UX Researcher', email: 'emily.w@example.com' },
];