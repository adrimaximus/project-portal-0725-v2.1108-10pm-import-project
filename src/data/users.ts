export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatar?: string;
}

export const user1: User = { id: 'user-1', name: 'Alice', initials: 'A', email: 'alice@example.com' };
export const user2: User = { id: 'user-2', name: 'Bob', initials: 'B', email: 'bob@example.com' };

export const allUsers: User[] = [
  user1,
  user2,
  { id: 'user-3', name: 'Charlie', initials: 'C', email: 'charlie@example.com' },
  { id: 'user-4', name: 'Diana', initials: 'D', email: 'diana@example.com' },
];