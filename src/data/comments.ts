import { Comment } from "@/data/projects";

export const initialComments: Comment[] = [
  {
    id: "comment-1",
    projectId: "proj-1",
    user: {
      name: "Olivia Martin",
      avatar: "https://i.pravatar.cc/150?u=olivia",
      role: "Designer",
      id: "user-2",
      email: "olivia@example.com"
    },
    text: "Just a heads up, the latest designs for the user dashboard are ready for review. I've attached the Figma link.",
    timestamp: "2 days ago",
    isTicket: false,
  },
  {
    id: "comment-2",
    projectId: "proj-1",
    user: {
      name: "Ethan Carter",
      avatar: "https://i.pravatar.cc/150?u=ethan",
      role: "Developer",
      id: "user-3",
      email: "ethan@example.com"
    },
    text: "I'm encountering a bug on the staging server where the login button is unresponsive. I've raised a ticket for this.",
    timestamp: "1 day ago",
    isTicket: true,
  },
  {
    id: "comment-3",
    projectId: "proj-1",
    user: {
      name: "You",
      avatar: "https://i.pravatar.cc/150?u=currentuser",
      role: "Manager",
      id: "user-1",
      email: "you@example.com"
    },
    text: "Thanks for the update, Olivia. I'll take a look at the designs today.",
    timestamp: "1 day ago",
    isTicket: false,
  },
  {
    id: "comment-4",
    projectId: "proj-2",
    user: {
      name: "Sophia Davis",
      avatar: "https://i.pravatar.cc/150?u=sophia",
      role: "Client",
      id: "user-4",
      email: "sophia@example.com"
    },
    text: "The client has requested a new feature: the ability to export reports as CSV files. I've created a ticket to track this request.",
    timestamp: "3 hours ago",
    isTicket: true,
  },
  {
    id: "comment-5",
    projectId: "proj-3",
    user: {
      name: "Liam Brown",
      avatar: "https://i.pravatar.cc/150?u=liam",
      role: "Marketing",
      id: "user-5",
      email: "liam@example.com"
    },
    text: "The campaign is underperforming. We need to rethink the ad copy. Ticket raised.",
    timestamp: "5 hours ago",
    isTicket: true,
  },
];