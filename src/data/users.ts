export interface User {
  id: string;
  name: string;
  initials: string;
  avatar: string;
}

export const allUsers: User[] = [
  { id: 'u1', name: 'Olivia Martin', initials: 'OM', avatar: '/avatars/01.png' },
  { id: 'u2', name: 'Jackson Lee', initials: 'JL', avatar: '/avatars/02.png' },
  { id: 'u3', name: 'Isabella Nguyen', initials: 'IN', avatar: '/avatars/03.png' },
  { id: 'u4', name: 'William Kim', initials: 'WK', avatar: '/avatars/04.png' },
  { id: 'u5', name: 'Sophia Davis', initials: 'SD', avatar: '/avatars/05.png' },
];