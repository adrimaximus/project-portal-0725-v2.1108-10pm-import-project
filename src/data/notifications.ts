export type Notification = {
  id: string;
  avatar: string;
  name: string;
  action: string;
  target: string;
  time: string;
  read: boolean;
};

export const dummyNotifications: Notification[] = [
  {
    id: "1",
    avatar: "https://github.com/shadcn.png",
    name: "John Doe",
    action: "commented on your post",
    target: "Project Alpha Update",
    time: "10m ago",
    read: false,
  },
  {
    id: "2",
    avatar: "https://github.com/shadcn.png",
    name: "Jane Smith",
    action: "mentioned you in a comment",
    target: "Q3 Financial Report",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    avatar: "https://github.com/shadcn.png",
    name: "Acme Inc.",
    action: "updated the status of",
    target: "Task #1234",
    time: "3h ago",
    read: false,
  },
  {
    id: "4",
    avatar: "https://github.com/shadcn.png",
    name: "Robert Brown",
    action: "assigned you a new task",
    target: "Design new landing page",
    time: "1d ago",
    read: true,
  },
  {
    id: "5",
    avatar: "https://github.com/shadcn.png",
    name: "Emily White",
    action: "approved your request for",
    target: "Budget Increase",
    time: "2d ago",
    read: true,
  },
];