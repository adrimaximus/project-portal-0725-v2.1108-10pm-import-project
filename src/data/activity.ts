import { MessageSquare, Pencil, ShoppingCart, Receipt } from "lucide-react";

export type Activity = {
  id: string;
  projectId: string;
  type: "comment" | "edit" | "order" | "invoice";
  title: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
};

export const dummyActivities: Activity[] = [
  {
    id: "ACT-001",
    projectId: "PROJ-001",
    type: "comment",
    title: "Started conversation about mockups.",
    timestamp: "2024-07-25T10:30:00Z",
    user: { name: "Alex Smith", avatar: "https://i.pravatar.cc/150?u=alex" },
  },
  {
    id: "ACT-002",
    projectId: "PROJ-001",
    type: "edit",
    title: "Updated the project deadline.",
    timestamp: "2024-07-24T15:00:00Z",
    user: { name: "Alma Mahmberg", avatar: "https://i.pravatar.cc/150?u=alma" },
  },
  {
    id: "ACT-003",
    projectId: "PROJ-002",
    type: "order",
    title: "New order #12965 placed.",
    timestamp: "2024-07-23T09:05:00Z",
    user: { name: "Tech Solutions Ltd.", avatar: "https://i.pravatar.cc/150?u=tech" },
  },
  {
    id: "ACT-004",
    projectId: "PROJ-001",
    type: "invoice",
    title: "Invoice #INV-2024-07-12 sent.",
    timestamp: "2024-07-22T14:00:00Z",
    user: { name: "Alma Mahmberg", avatar: "https://i.pravatar.cc/150?u=alma" },
  },
  {
    id: "ACT-005",
    projectId: "PROJ-004",
    type: "comment",
    title: "Client requested a change in the checkout flow.",
    timestamp: "2024-07-21T11:45:00Z",
    user: { name: "Retail Giant", avatar: "https://i.pravatar.cc/150?u=retail" },
  },
];

export const activityIcons = {
  comment: MessageSquare,
  edit: Pencil,
  order: ShoppingCart,
  invoice: Receipt,
};

export const activityColors = {
    comment: "bg-blue-500",
    edit: "bg-yellow-500",
    order: "bg-green-500",
    invoice: "bg-red-500",
};