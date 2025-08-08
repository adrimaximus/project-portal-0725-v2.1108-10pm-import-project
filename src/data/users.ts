export interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
  initials: string;
}

export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', role: 'Project Manager', email: 'alex@example.com', initials: 'AJ' },
  { id: 'user-2', name: 'Samantha Bee', avatar: 'https://i.pravatar.cc/150?u=samantha', role: 'Lead Designer', email: 'samantha@example.com', initials: 'SB' },
  { id: 'user-3', name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?u=michael', role: 'Lead Developer', email: 'michael@example.com', initials: 'MC' },
  { id: 'user-4', name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily', role: 'UX Researcher', email: 'emily@example.com', initials: 'ED' },
  { id: 'user-5', name: 'David Wilson', avatar: 'https://i.pravatar.cc/150?u=david', role: 'QA Tester', email: 'david@example.com', initials: 'DW' },
];

export const allUsers = dummyUsers;