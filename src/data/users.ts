export interface User {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  initials: string;
  email: string;
  role: string;
}

export const allUsers: User[] = [
  { id: 'user-1', name: 'You', avatar: '/avatars/you.png', initials: 'Y', email: 'you@example.com', role: 'Admin' },
  { id: 'user-2', name: 'Alex', avatar: '/avatars/alex.png', initials: 'A', email: 'alex@example.com', role: 'Member' },
  { id: 'user-3', name: 'Sarah', avatar: '/avatars/sarah.png', initials: 'S', email: 'sarah@example.com', role: 'Member' },
  { id: 'user-4', name: 'Mike', avatar: '/avatars/mike.png', initials: 'M', email: 'mike@example.com', role: 'Client' },
  { id: 'user-5', name: 'Jane', avatar: '/avatars/jane.png', initials: 'J', email: 'jane@example.com', role: 'View Only' },
];

export const getUserByName = (name: string): User | undefined => {
  return allUsers.find(user => user.name === name);
};