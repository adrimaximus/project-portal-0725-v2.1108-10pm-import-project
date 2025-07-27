import { Comment } from '@/components/ProjectComments';

export const dummyComments: Comment[] = [
  {
    id: 1,
    projectId: 'proj-1',
    user: { name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice' },
    text: 'Initial mockups are ready for review. Please check the attached file.',
    timestamp: '2 days ago',
    attachment: { name: 'mockups_v1.pdf', url: '#', type: 'file' }
  },
  {
    id: 2,
    projectId: 'proj-1',
    user: { name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob' },
    text: 'The login functionality is not working on the staging server. Creating a ticket for this.',
    timestamp: '1 day ago',
    isTicket: true,
  },
  {
    id: 3,
    projectId: 'proj-2',
    user: { name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie' },
    text: 'The final version of the app has been deployed to the app stores.',
    timestamp: '5 days ago',
  },
  {
    id: 4,
    projectId: 'proj-4',
    user: { name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?u=diana' },
    text: 'We need a new set of logo variations for the marketing team.',
    timestamp: '3 hours ago',
    isTicket: true,
  },
];