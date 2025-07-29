export interface Comment {
  id: string;
  projectId: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  text: string;
  isTicket?: boolean;
}

export const initialComments: Comment[] = [
  {
    id: 'c1',
    projectId: 'proj-1',
    user: { name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane' },
    timestamp: '2023-10-26T10:00:00Z',
    text: 'Initial brief and assets uploaded.',
  },
  {
    id: 'c2',
    projectId: 'proj-1',
    user: { name: 'John Smith', avatar: 'https://i.pravatar.cc/150?u=john' },
    timestamp: '2023-10-26T11:30:00Z',
    text: 'Can we get a revision on the logo? The color is a bit off.',
    isTicket: true,
  },
  {
    id: 'c3',
    projectId: 'proj-2',
    user: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
    timestamp: '2023-10-25T14:00:00Z',
    text: 'The development for the homepage is complete. Awaiting review.',
  },
  {
    id: 'c4',
    projectId: 'proj-3',
    user: { name: 'Emily White', avatar: 'https://i.pravatar.cc/150?u=emily' },
    timestamp: '2023-10-27T09:00:00Z',
    text: 'Marketing campaign draft #1 is ready for feedback.',
  },
  {
    id: 'c5',
    projectId: 'proj-1',
    user: { name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane' },
    timestamp: '2023-10-27T15:00:00Z',
    text: 'Logo revision is complete and uploaded.',
  },
];