export type User = {
  id: string;
  name: string;
  avatar: string;
  status: 'Online' | 'Offline';
};

export const allUsers: User[] = [
  { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', status: 'Online' },
  { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob', status: 'Offline' },
  { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie', status: 'Online' },
  { id: 'user-4', name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?u=diana', status: 'Online' },
  { id: 'user-5', name: 'Ethan Hunt', avatar: 'https://i.pravatar.cc/150?u=ethan', status: 'Offline' },
  { id: 'user-6', name: 'Fiona Glenanne', avatar: 'https://i.pravatar.cc/150?u=fiona', status: 'Online' },
  { id: 'user-7', name: 'Sam Axe', avatar: 'https://i.pravatar.cc/150?u=sam', status: 'Offline' },
  { id: 'user-8', name: 'Grace O\'Malley', avatar: 'https://i.pravatar.cc/150?u=grace', status: 'Online' },
  { id: 'user-9', name: 'Michael Westen', avatar: 'https://i.pravatar.cc/150?u=michael', status: 'Online' },
];