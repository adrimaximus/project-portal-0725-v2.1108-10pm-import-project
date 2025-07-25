import { Request } from '@/types';

export const dummyRequests: Request[] = [
  {
    id: 'REQ-001',
    title: 'Implement Dark Mode',
    type: 'Feature',
    status: 'In Progress',
    submittedBy: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026704d',
    date: '2024-07-20',
  },
  {
    id: 'REQ-002',
    title: 'Fix login button alignment',
    type: 'Bug',
    status: 'Completed',
    submittedBy: 'John Smith',
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026705d',
    date: '2024-07-19',
  },
  {
    id: 'REQ-003',
    title: 'Add social media sharing options',
    type: 'Feature',
    status: 'Pending',
    submittedBy: 'Peter Jones',
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026706d',
    date: '2024-07-22',
  },
  {
    id: 'REQ-004',
    title: 'Improve mobile responsiveness of dashboard',
    type: 'Feedback',
    status: 'Pending',
    submittedBy: 'Sarah Miller',
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026707d',
    date: '2024-07-21',
  },
  {
    id: 'REQ-005',
    title: 'API endpoint returning 500 error',
    type: 'Bug',
    status: 'Rejected',
    submittedBy: 'Alex Johnson',
    avatar: 'https://i.pravatar.cc/40?u=a042581f4e29026708d',
    date: '2024-07-18',
  },
];