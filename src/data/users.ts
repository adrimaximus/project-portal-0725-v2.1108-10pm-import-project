export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  initials: string;
}

export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ' },
  { id: 'user-2', name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=bob', initials: 'BW' },
  { id: 'user-3', name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/150?u=charlie', initials: 'CB' },
  { id: 'user-4', name: 'Diana Prince', avatarUrl: 'https://i.pravatar.cc/150?u=diana', initials: 'DP' },
];

export const currentUser: User = { id: 'user-0', name: 'Alex', avatarUrl: 'https://i.pravatar.cc/150?u=alex', initials: 'A' };