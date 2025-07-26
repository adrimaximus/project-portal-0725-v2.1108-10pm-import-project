export type Comment = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  content: string;
};

export const dummyComments: Comment[] = [
  {
    id: 'COMMENT-1',
    author: {
      name: 'Alice Johnson',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
    timestamp: '2023-06-15T10:30:00Z',
    content: 'Great progress on the homepage design. The new layout looks much cleaner.',
  },
  {
    id: 'COMMENT-2',
    author: {
      name: 'Bob Williams',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    },
    timestamp: '2023-06-15T11:00:00Z',
    content: 'I agree. I\'ve pushed the latest backend changes for the user authentication flow. Ready for integration.',
  },
];