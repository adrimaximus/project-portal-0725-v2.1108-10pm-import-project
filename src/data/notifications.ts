import { MessageSquare, AtSign, FolderKanban, Info, Target } from "lucide-react";
import { Notification } from '@/types';

export const notificationIcons = {
  comment: MessageSquare,
  mention: AtSign,
  project: FolderKanban,
  project_update: FolderKanban,
  system: Info,
  goal: Target,
};

export const dummyNotifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned",
    description: "Alex Smith mentioned you in a comment on the 'E-commerce Platform' project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    link: "/projects/proj-1",
  },
  {
    id: "2",
    type: "project",
    title: "Project Update",
    description: "The status of 'Mobile App Redesign' was changed to 'Completed'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    link: "#",
  },
  {
    id: "3",
    type: "comment",
    title: "New Comment",
    description: "Jane Doe left a comment on the 'Q3 Marketing Campaign' task.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    read: true,
    link: "#",
  },
  {
    id: "4",
    type: "system",
    title: "System Maintenance",
    description: "Scheduled maintenance will occur this Saturday at 10 PM.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    link: "#",
  },
  {
    id: "5",
    type: "project",
    title: "New Project Assigned",
    description: "You have been assigned to the new 'Data Analytics Dashboard' project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false,
    link: "#",
  },
];