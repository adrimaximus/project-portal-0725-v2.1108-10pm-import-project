export type UserRole = 'Owner' | 'Admin' | 'User' | 'Read only';
export type UserStatus = 'Active' | 'Suspended' | 'Pending invite';

export interface User {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  role: UserRole;
  status: UserStatus;
  initials: string;
  avatar: string;
}

export interface RelatedContact {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

export const users: User[] = [
  { id: '1', name: 'Theresa Webb', email: 'theresa.webb@example.com', lastActive: '23 Dec 2022', role: 'Owner', status: 'Active', initials: getInitials('Theresa Webb'), avatar: `https://avatar.vercel.sh/theresa.webb@example.com.png` },
  { id: '2', name: 'Darlene Robertson', email: 'darlene.robertson@example.com', lastActive: '23 Dec 2022', role: 'User', status: 'Suspended', initials: getInitials('Darlene Robertson'), avatar: `https://avatar.vercel.sh/darlene.robertson@example.com.png` },
  { id: '3', name: 'Annette Black', email: 'annette.black@example.com', lastActive: '23 Dec 2022', role: 'User', status: 'Active', initials: getInitials('Annette Black'), avatar: `https://avatar.vercel.sh/annette.black@example.com.png` },
  { id: '4', name: 'Floyd Miles', email: 'floyd.miles@example.com', lastActive: '23 Dec 2022', role: 'Read only', status: 'Pending invite', initials: getInitials('Floyd Miles'), avatar: `https://avatar.vercel.sh/floyd.miles@example.com.png` },
  { id: '5', name: 'Cody Fisher', email: 'cody.fisher@example.com', lastActive: '23 Dec 2022', role: 'Admin', status: 'Active', initials: getInitials('Cody Fisher'), avatar: `https://avatar.vercel.sh/cody.fisher@example.com.png` },
  { id: '6', name: 'Courtney Henry', email: 'courtney.henry@example.com', lastActive: '23 Dec 2022', role: 'Admin', status: 'Active', initials: getInitials('Courtney Henry'), avatar: `https://avatar.vercel.sh/courtney.henry@example.com.png` },
];

export const relatedContacts: RelatedContact[] = [
    { id: '7', name: 'Kristin Watson', email: 'kristin.watson@example.com', role: 'Read only' },
    { id: '8', name: 'Leslie Alexander', email: 'leslie.alexander@example.com', role: 'Read only' },
];

// For backward compatibility
export const allUsers = users;
export const user1 = users[0];
export const user2 = users[1];