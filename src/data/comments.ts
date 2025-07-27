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

export const dummyComments: Comment[] = [
  {
    id: 1,
    projectId: "proj-1",
    user: { name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=alice" },
    text: "Can we get an update on the payment gateway integration?",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    projectId: "proj-1",
    user: { name: "Bob Williams", avatar: "https://i.pravatar.cc/150?u=bob" },
    text: "The new designs for the product page are ready for review.",
    timestamp: "1 day ago",
    attachment: {
      name: "product-page-v2.jpg",
      url: "/placeholder.svg",
      type: "image",
    },
  },
  {
    id: 3,
    projectId: "proj-1",
    user: { name: "Charlie Brown", avatar: "https://i.pravatar.cc/150?u=charlie" },
    text: "I've found a bug in the checkout process. The shipping cost is not being calculated correctly. I'm creating a ticket for this.",
    timestamp: "3 hours ago",
    isTicket: true,
  },
  {
    id: 4,
    projectId: "proj-2",
    user: { name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=diana" },
    text: "The final QA report is attached. We are good to go for launch!",
    timestamp: "4 days ago",
    attachment: {
      name: "QA-Report-Final.pdf",
      url: "#",
      type: "file",
    },
  },
];