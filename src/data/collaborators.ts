export interface Collaborator {
  name: string;
  src: string;
}

export const currentUser: Collaborator = {
  name: "You",
  src: "https://github.com/shadcn.png",
};

// Daftar kolaborator yang bisa di-mention
export const collaborators: Collaborator[] = [
  { name: "Sophia Davis", src: "https://i.pravatar.cc/150?u=sophia" },
  { name: "Liam Brown", src: "https://i.pravatar.cc/150?u=liam" },
  { name: "Olivia Martin", src: "https://i.pravatar.cc/150?u=olivia" },
  { name: "Jackson Lee", src: "https://i.pravatar.cc/150?u=jackson" },
  { name: "Ethan Carter", src: "https://i.pravatar.cc/150?u=ethan" },
];