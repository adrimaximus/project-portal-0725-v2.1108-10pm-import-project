export interface User {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  initials: string;
}

export const allUsers: User[] = [
  { id: 'user-1', name: 'You', avatar: '/avatars/you.png', initials: 'Y' },
  { id: 'user-2', name: 'Alex', avatar: '/avatars/alex.png', initials: 'A' },
  { id: 'user-3', name: 'Sarah', avatar: '/avatars/sarah.png', initials: 'S' },
  { id: 'user-4', name: 'Mike', avatar: '/avatars/mike.png', initials: 'M' },
  { id: 'user-5', name: 'Jane', avatar: '/avatars/jane.png', initials: 'J' },
];

export const getUserByName = (name: string): User | undefined => {
  return allUsers.find(user => user.name === name);
};