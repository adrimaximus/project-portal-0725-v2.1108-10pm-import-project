export interface User {
  id: string;
  name: string;
  avatar: string;
}

// Menggunakan pravatar untuk avatar acak
export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Andi', avatar: 'https://i.pravatar.cc/150?u=andi' },
  { id: 'user-2', name: 'Budi', avatar: 'https://i.pravatar.cc/150?u=budi' },
  { id: 'user-3', name: 'Citra', avatar: 'https://i.pravatar.cc/150?u=citra' },
  { id: 'user-4', name: 'Dewi', avatar: 'https://i.pravatar.cc/150?u=dewi' },
  { id: 'user-5', name: 'Eka', avatar: 'https://i.pravatar.cc/150?u=eka' },
];