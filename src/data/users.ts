import { Collaborator as User } from '@/types';

export const user1: User = { id: 'user-1', name: 'Alice', initials: 'A', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice' };
export const user2: User = { id: 'user-2', name: 'Bob', initials: 'B', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/150?u=bob' };

export const allUsers: User[] = [
  user1,
  user2,
  { id: 'user-3', name: 'Charlie', initials: 'C', email: 'charlie@example.com', avatar: 'https://i.pravatar.cc/150?u=charlie' },
  { id: 'user-4', name: 'Diana', initials: 'D', email: 'diana@example.com', avatar: 'https://i.pravatar.cc/150?u=diana' },
];