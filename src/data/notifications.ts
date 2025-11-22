import { 
  MessageSquare, 
  AtSign, 
  FolderKanban, 
  Info, 
  Target,
  ListChecks,
  UserPlus,
  BookOpen,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  Megaphone
} from "lucide-react";
import { AppNotification } from '@/types';

export const notificationIcons = {
  comment: MessageSquare,
  mention: AtSign,
  discussion_mention: AtSign,
  project: FolderKanban,
  project_update: FolderKanban,
  project_status_updated: FolderKanban,
  system: Info,
  goal: Target,
  goal_invite: Target,
  goal_progress_update: TrendingUp,
  task_assignment: ListChecks,
  task_overdue: AlertTriangle,
  project_invite: UserPlus,
  kb_invite: BookOpen,
  payment_status_updated: CreditCard,
  billing_reminder: Receipt,
  broadcast: Megaphone,
};

const dummyActor1 = {
  id: 'user-1',
  name: 'Alex Smith',
  avatar_url: 'https://i.pravatar.cc/150?u=alexsmith',
};

const dummyActor2 = {
  id: 'user-2',
  name: 'Jane Doe',
  avatar_url: 'https://i.pravatar.cc/150?u=janedoe',
};

const systemActor = {
    id: 'system',
    name: 'System',
    avatar_url: '',
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
    actor: systemActor,
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
    actor: systemActor,
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