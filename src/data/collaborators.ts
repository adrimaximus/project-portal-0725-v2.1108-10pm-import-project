import { Collaborator } from "../types";

export const allCollaborators: Collaborator[] = [
  {
    id: "usr_1",
    name: "Andi Wijaya",
    fallback: "AW",
    online: true,
    src: "https://i.pravatar.cc/150?u=usr_1",
  },
  {
    id: "usr_2",
    name: "Bunga Citra",
    fallback: "BC",
    online: true,
    src: "https://i.pravatar.cc/150?u=usr_2",
  },
  {
    id: "usr_3",
    name: "Cahyo Nugroho",
    fallback: "CN",
    online: true,
    src: "https://i.pravatar.cc/150?u=usr_3",
  },
  {
    id: "usr_4",
    name: "Dewi Lestari",
    fallback: "DL",
    online: true,
    src: "https://i.pravatar.cc/150?u=usr_4",
  },
  {
    id: "usr_5",
    name: "Eko Prasetyo",
    fallback: "EP",
    online: false,
    src: "https://i.pravatar.cc/150?u=usr_5",
  },
  {
    id: "usr_6",
    name: "Fitriani",
    fallback: "F",
    online: true,
    src: "https://i.pravatar.cc/150?u=usr_6",
  },
  {
    id: "usr_7",
    name: "Gilang Ramadhan",
    fallback: "GR",
    online: false,
    src: "https://i.pravatar.cc/150?u=usr_7",
  },
];

export const currentUser: Collaborator = {
  id: "usr_0",
  name: "You",
  fallback: "Y",
  online: true,
  src: "https://i.pravatar.cc/150?u=usr_0",
};