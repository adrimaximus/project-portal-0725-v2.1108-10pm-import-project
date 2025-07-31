export interface User {
  id: string;
  name: string;
  initials: string;
  status: 'online' | 'offline';
  avatar: string;
  role: string;
}

export const allUsers: User[] = [
  { id: 'user-1', name: 'Alice Johnson', initials: 'AJ', status: 'online', avatar: `https://ui-avatars.com/api/?name=Alice+Johnson&background=random`, role: 'Developer' },
  { id: 'user-2', name: 'Bob Williams', initials: 'BW', status: 'offline', avatar: `https://ui-avatars.com/api/?name=Bob+Williams&background=random`, role: 'Designer' },
  { id: 'user-3', name: 'Charlie Brown', initials: 'CB', status: 'online', avatar: `https://ui-avatars.com/api/?name=Charlie+Brown&background=random`, role: 'Project Manager' },
  { id: 'user-4', name: 'Diana Miller', initials: 'DM', status: 'online', avatar: `https://ui-avatars.com/api/?name=Diana+Miller&background=random`, role: 'QA Tester' },
  { id: 'user-5', name: 'Ethan Davis', initials: 'ED', status: 'offline', avatar: `https://ui-avatars.com/api/?name=Ethan+Davis&background=random`, role: 'Developer' },
];