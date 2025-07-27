export type Comment = {
  id: number;
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
    url: string;
    type: 'image' | 'file';
  };
};

export let initialComments: Comment[] = [
  {
    id: 1,
    projectId: "proj-1",
    user: { name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=alice" },
    text: "Initial kickoff meeting scheduled for tomorrow. Please review the project brief.",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    projectId: "proj-1",
    user: { name: "Bob Williams", avatar: "https://i.pravatar.cc/150?u=bob" },
    text: "The database schema is ready for review. I've attached the ERD diagram.",
    timestamp: "1 day ago",
    attachment: { name: "ERD_v1.pdf", url: "#", type: "file" },
  },
  {
    id: 3,
    projectId: "proj-1",
    user: { name: "Charlie Brown", avatar: "https://i.pravatar.cc/150?u=charlie" },
    text: "I'm having trouble accessing the staging server. Can someone help?",
    timestamp: "3 hours ago",
    isTicket: true,
  },
  {
    id: 4,
    projectId: "proj-2",
    user: { name: "Diana Miller", avatar: "https://i.pravatar.cc/150?u=diana" },
    text: "The final version of the app has been submitted to the App Store.",
    timestamp: "1 week ago",
  },
];