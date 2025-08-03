import { Collaborator } from "../types";

export const allCollaborators: Collaborator[] = [
  {
    id: "usr_1",
    name: "Andi Wijaya",
    initials: "AW",
    online: true,
    avatar: "https://i.pravatar.cc/150?u=usr_1",
    email: "andi.wijaya@example.com",
  },
  {
    id: "usr_2",
    name: "Bunga Citra",
    initials: "BC",
    online: true,
    avatar: "https://i.pravatar.cc/150?u=usr_2",
    email: "bunga.citra@example.com",
  },
  {
    id: "usr_3",
    name: "Cahyo Nugroho",
    initials: "CN",
    online: true,
    avatar: "https://i.pravatar.cc/150?u=usr_3",
    email: "cahyo.nugroho@example.com",
  },
  {
    id: "usr_4",
    name: "Dewi Lestari",
    initials: "DL",
    online: true,
    avatar: "https://i.pravatar.cc/150?u=usr_4",
    email: "dewi.lestari@example.com",
  },
  {
    id: "usr_5",
    name: "Eko Prasetyo",
    initials: "EP",
    online: false,
    avatar: "https://i.pravatar.cc/150?u=usr_5",
    email: "eko.prasetyo@example.com",
  },
  {
    id: "usr_6",
    name: "Fitriani",
    initials: "F",
    online: true,
    avatar: "https://i.pravatar.cc/150?u=usr_6",
    email: "fitriani@example.com",
  },
  {
    id: "usr_7",
    name: "Gilang Ramadhan",
    initials: "GR",
    online: false,
    avatar: "https://i.pravatar.cc/150?u=usr_7",
    email: "gilang.ramadhan@example.com",
  },
];

export const currentUser: Collaborator = {
  id: "usr_0",
  name: "You",
  initials: "Y",
  online: true,
  avatar: "https://i.pravatar.cc/150?u=usr_0",
  email: "you@example.com",
};