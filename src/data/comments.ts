import { Comment } from './projects';
import { User } from './users';

const user1: User = { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ' };
const user2: User = { id: 'user-2', name: 'Michael Chen', email: 'michael@example.com', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=michael', initials: 'MC' };
const user3: User = { id: 'user-3', name: 'Samantha Bee', email: 'samantha@example.com', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=samantha', initials: 'SB' };

export const comments: Comment[] = [
  {
    id: 'comment-1',
    author: user1,
    timestamp: '2023-05-10T14:48:00.000Z',
    text: "Can you check the latest designs? I've updated the landing page.",
    isTicket: false,
  },
  {
    id: 'comment-2',
    author: user2,
    timestamp: '2023-05-10T15:23:00.000Z',
    text: "Looks great! I'll start implementing the front-end components.",
    isTicket: false,
  },
  {
    id: 'comment-3',
    author: user3,
    timestamp: '2023-05-11T09:00:00.000Z',
    text: 'New ticket created: "Fix login button responsiveness on mobile".',
    isTicket: true,
  },
];