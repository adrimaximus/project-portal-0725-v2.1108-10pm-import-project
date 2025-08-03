import { Comment } from '@/data/projects';
import { dummyUsers } from '@/data/users';

export const dummyComments: Comment[] = [
  {
    id: 'comment-1',
    user: dummyUsers[0],
    text: 'Here are the latest mockups. Let me know what you think!',
    timestamp: '2024-07-24T10:00:00Z',
  },
  {
    id: 'comment-2',
    user: dummyUsers[2],
    text: 'Looks great, Alice! Approved.',
    timestamp: '2024-07-24T11:30:00Z',
  },
  {
    id: 'comment-3',
    user: dummyUsers[1],
    text: 'I will start implementing this right away.',
    timestamp: '2024-07-24T11:35:00Z',
  },
];