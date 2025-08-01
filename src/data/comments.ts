import { Comment } from '@/data/projects';

export const initialComments: Comment[] = [
  {
    id: 'comment-1',
    projectId: 'proj-1',
    user: { id: 'user-2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
    text: 'Hey @Alice, can you review the latest design mockups?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isTicket: false,
  },
  {
    id: 'comment-2',
    projectId: 'proj-1',
    user: { id: 'user-1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
    text: '@Bob Sure, I will take a look this afternoon.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isTicket: false,
  },
  {
    id: 'comment-3',
    projectId: 'proj-1',
    user: { id: 'user-3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
    text: '@Bob The new auth flow needs to be documented in Confluence.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isTicket: true,
  },
];