import { Comment, AssignedUser } from '@/data/projects';

const user1: AssignedUser = { id: 'user-1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', email: 'alice@example.com', initials: 'A', role: 'Member' };
const user2: AssignedUser = { id: 'user-2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', email: 'bob@example.com', initials: 'B', role: 'Member' };
const user3: AssignedUser = { id: 'user-3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie', email: 'charlie@example.com', initials: 'C', role: 'Client' };

export const initialComments: Comment[] = [
  {
    id: 'comment-1',
    user: user2,
    text: 'Hey @Alice, can you review the latest design mockups?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isTicket: false,
  },
  {
    id: 'comment-2',
    user: user1,
    text: '@Bob Sure, I will take a look this afternoon.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isTicket: false,
  },
  {
    id: 'comment-3',
    user: user3,
    text: '@Bob The new auth flow needs to be documented in Confluence.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isTicket: true,
  },
];