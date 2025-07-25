import { Collaborator } from "@/types";

export const allCollaborators: Collaborator[] = [
  {
    id: "user-0",
    name: "Olivia Martin",
    src: "/avatars/01.png",
    fallback: "OM",
    online: true,
  },
  {
    id: "collab-1",
    name: "John Doe",
    src: "/avatars/02.png",
    fallback: "JD",
    online: true,
  },
  {
    id: "collab-2",
    name: "Jane Smith",
    src: "/avatars/03.png",
    fallback: "JS",
    online: false,
  },
  {
    id: "collab-3",
    name: "Mike Johnson",
    src: "/avatars/04.png",
    fallback: "MJ",
    online: true,
  },
  {
    id: "collab-4",
    name: "Emily Davis",
    src: "/avatars/05.png",
    fallback: "ED",
    online: false,
  },
];

export const currentUser: Collaborator = allCollaborators[0];