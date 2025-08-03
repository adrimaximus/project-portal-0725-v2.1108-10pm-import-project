export interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  email: string;
  role?: string;
}

export const dummyUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    initials: 'AJ',
    email: 'alice.j@example.com',
    role: 'Designer',
  },
  {
    id: '2',
    name: 'Alex Ray',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    initials: 'AR',
    email: 'alex.r@example.com',
    role: 'Developer',
  },
  {
    id: '3',
    name: 'Bob Williams',
    avatar: 'https://i.pravatar.cc/150?u=bob',
    initials: 'BW',
    email: 'bob.w@example.com',
    role: 'Project Manager',
  },
  {
    id: '4',
    name: 'Charlie Brown',
    avatar: 'https://i.pravatar.cc/150?u=charlie',
    initials: 'CB',
    email: 'charlie.b@example.com',
    role: 'QA Tester',
  },
];