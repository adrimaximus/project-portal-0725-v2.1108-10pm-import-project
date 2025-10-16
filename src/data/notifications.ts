import { MessageSquare, AtSign, FolderKanban, Info, Target } from "lucide-react";
import { AppNotification } from '@/types';

export const notificationIcons = {
  comment: MessageSquare,
  mention: AtSign,
  project: FolderKanban,
  project_update: FolderKanban,
  system: Info,
  goal: Target,
};

const dummyActor1 = {
  id: 'user-1',
  name: 'Alex Smith',
  avatar_url: 'https://i.pravatar.cc/150?u=alexsmith'
};

const dummyActor2 = {
  id: 'user-2',
  name: 'Jane Doe',
  avatar_url: 'https://i.pravatar.cc/150?u=janedoe'
};

export const dummyNotifications: AppNotification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned",
    description: "Alex Smith mentioned you in a comment on the 'E-commerce Platform' project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    link: "/projects/proj-1",
    actor: dummyActor1,
  },
  {
    id: "2",
    type: "project",
    title: "Project Update",
    description: "The status of 'Mobile App Redesign' was changed to 'Completed'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    link: "#",
    actor: dummyActor2,
  },
  {
    id: "3",
    type: "comment",
    title: "New Comment",
    description: "Jane Doe left a comment on the 'Q3 Marketing Campaign' task.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    read: true,
    link: "#",
    actor: dummyActor2,
  },
  {
    id: "4",
    type: "system",
    title: "System Maintenance",
    description: "Scheduled maintenance will occur this Saturday at 10 PM.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    link: "#",
    actor: {
      id: 'system',
      name: 'System',
      avatar_url: ''
    },
  },
  {
    id: "5",
    type: "project",
    title: "New Project Assigned",
    description: "You have been assigned to the new 'Data Analytics Dashboard' project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false,
    link: "#",
    actor: dummyActor1,
  },
];