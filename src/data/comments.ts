export interface Comment {
  id: string;
  projectId: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  isTicket?: boolean;
  attachment?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

export const initialComments: Comment[] = [
    {
      id: 'comment-1',
      projectId: 'proj-1',
      user: { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
      text: 'Just reviewed the wireframes, they look great! One small suggestion: can we make the CTA button on the homepage a bit larger?',
      timestamp: '2024-08-15T10:30:00Z',
    },
    {
      id: 'comment-2',
      projectId: 'proj-1',
      user: { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
      text: '@Alice Good point! I\'ll update the design. I\'ve also attached the latest brand guidelines for reference. #/Website Redesign',
      timestamp: '2024-08-15T11:00:00Z',
      isTicket: true,
      attachment: { name: 'Brand-Guidelines-v2.pdf', size: 1300000, type: 'application/pdf', url: '#' },
    },
    {
      id: 'comment-3',
      projectId: 'proj-2',
      user: { name: 'David', avatar: 'https://i.pravatar.cc/150?u=david' },
      text: 'We\'re hitting a snag with the real-time sync feature. The database connection is unstable. @Bob can you take a look?',
      timestamp: '2024-08-16T14:00:00Z',
      isTicket: true,
    },
];