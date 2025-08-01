import { FileText, UserPlus, MessageSquare, CheckCircle } from 'lucide-react';

export type Notification = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

export const dummyNotifications: Notification[] = [
  {
    id: '1',
    icon: FileText,
    title: 'New Project Brief Uploaded',
    description: 'A new brief for "Project Phoenix" has been uploaded by John Doe.',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    icon: UserPlus,
    title: 'You have been added to a team',
    description: 'You were added to the "Marketing Campaign" project team.',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: '3',
    icon: MessageSquare,
    title: 'New Message from Sarah',
    description: 'Hey, can we have a quick sync on the Q3 report?',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    icon: CheckCircle,
    title: 'Task "Create Wireframes" Completed',
    description: 'Jane Smith has marked the task as completed.',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: '5',
    icon: FileText,
    title: 'Invoice for "Project Apollo" is due',
    description: 'The invoice #INV-2024-003 is due in 5 days.',
    timestamp: '4 days ago',
    read: true,
  },
];