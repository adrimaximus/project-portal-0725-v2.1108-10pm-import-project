import { Comment } from '@/components/ProjectComments';

export const initialComments: Comment[] = [
  {
    id: 'comment-1',
    projectId: "proj-001",
    author: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    text: 'This is the first comment on the project. Looking forward to updates.',
    timestamp: '2023-10-26T10:00:00Z',
    isTicket: false,
  },
  {
    id: 'comment-2',
    projectId: "proj-001",
    author: 'Jane Smith',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    text: 'I have a question about the deadline. Can we discuss it?',
    timestamp: '2023-10-26T11:30:00Z',
    isTicket: true,
  },
  {
    id: 'comment-3',
    projectId: "proj-002",
    author: 'Admin',
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    text: 'Project kickoff meeting is scheduled for tomorrow at 10 AM.',
    timestamp: '2023-10-27T09:00:00Z',
    isTicket: false,
  },
  {
    id: 'comment-4',
    projectId: "proj-003",
    author: 'Emily White',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    text: 'Found a bug in the latest deployment. The login button is not working on Firefox.',
    timestamp: '2023-10-28T14:15:00Z',
    isTicket: true,
  },
  {
    id: 'comment-5',
    projectId: "proj-001",
    author: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    text: 'Thanks for the update, Jane. Let\'s sync up.',
    timestamp: '2023-10-26T12:00:00Z',
    isTicket: false,
  },
];