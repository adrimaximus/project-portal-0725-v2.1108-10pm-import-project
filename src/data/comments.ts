import { Comment } from "@/components/ProjectComments";

export const initialComments: Comment[] = [
  {
    id: 1,
    user: {
      name: "Olivia Martin",
      avatar: "https://i.pravatar.cc/150?u=olivia",
    },
    text: "Just a heads up, the latest designs for the user dashboard are ready for review. I've attached the Figma link.",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    user: {
      name: "Ethan Carter",
      avatar: "https://i.pravatar.cc/150?u=ethan",
    },
    text: "I'm encountering a bug on the staging server where the login button is unresponsive. I've raised a ticket for this.",
    timestamp: "1 day ago",
    isTicket: true,
  },
  {
    id: 3,
    user: {
      name: "You",
      avatar: "https://i.pravatar.cc/150?u=currentuser",
    },
    text: "Thanks for the update, Olivia. I'll take a look at the designs today.",
    timestamp: "1 day ago",
  },
  {
    id: 4,
    user: {
      name: "Sophia Davis",
      avatar: "https://i.pravatar.cc/150?u=sophia",
    },
    text: "The client has requested a new feature: the ability to export reports as CSV files. I've created a ticket to track this request.",
    timestamp: "3 hours ago",
    isTicket: true,
    attachment: {
      name: "feature-request.pdf",
      url: "#",
      type: 'file',
    }
  },
];