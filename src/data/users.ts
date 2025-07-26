import { AssignedUser } from "./projects";

export type User = Omit<AssignedUser, 'status'>;

export const allUsers: User[] = [
  { id: 'user-1', name: "Ethan Carter", avatar: "https://i.pravatar.cc/150?u=ethan" },
  { id: 'user-2', name: "Olivia Martin", avatar: "https://i.pravatar.cc/150?u=olivia" },
  { id: 'user-3', name: "Sophia Davis", avatar: "https://i.pravatar.cc/150?u=sophia" },
  { id: 'user-4', name: "Liam Brown", avatar: "https://i.pravatar.cc/150?u=liam" },
  { id: 'user-5', name: "Ava Garcia", avatar: "https://i.pravatar.cc/150?u=ava" },
  { id: 'user-6', name: "Jackson Lee", avatar: "https://i.pravatar.cc/150?u=jackson" },
  { id: 'user-7', name: "Noah Rodriguez", avatar: "https://i.pravatar.cc/150?u=noah" },
  { id: 'user-8', name: "Isabella Wilson", avatar: "https://i.pravatar.cc/150?u=isabella" },
  { id: 'user-9', name: "Mason Moore", avatar: "https://i.pravatar.cc/150?u=mason" },
];