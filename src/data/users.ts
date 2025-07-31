export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', avatar: '/avatars/01.png', initials: 'AJ' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', avatar: '/avatars/02.png', initials: 'BW' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: '/avatars/03.png', initials: 'CB' },
  { id: 'user-4', name: 'Diana Miller', email: 'diana@example.com', avatar: '/avatars/04.png', initials: 'DM' },
  { id: 'user-5', name: 'Ethan Davis', email: 'ethan@example.com', avatar: '/avatars/05.png', initials: 'ED' },
];

export const allUsers = dummyUsers;