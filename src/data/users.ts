export interface User {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  email: string;
}

export const allUsers: User[] = [
  { id: 'u1', name: 'Olivia Martin', initials: 'OM', avatar: '/avatars/01.png', email: 'olivia.martin@example.com' },
  { id: 'u2', name: 'Jackson Lee', initials: 'JL', avatar: '/avatars/02.png', email: 'jackson.lee@example.com' },
  { id: 'u3', name: 'Isabella Nguyen', initials: 'IN', avatar: '/avatars/03.png', email: 'isabella.nguyen@example.com' },
  { id: 'u4', name: 'William Kim', initials: 'WK', avatar: '/avatars/04.png', email: 'william.kim@example.com' },
  { id: 'u5', name: 'Sophia Davis', initials: 'SD', avatar: '/avatars/05.png', email: 'sophia.davis@example.com' },
];