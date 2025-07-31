import { User } from './projects';

export const user1: User = { id: 'user-1', name: 'Ahmad Subagja', initials: 'AS', avatar: 'https://i.pravatar.cc/150?u=ahmad' };
export const user2: User = { id: 'user-2', name: 'Budi Santoso', initials: 'BS', avatar: 'https://i.pravatar.cc/150?u=budi' };

export const allUsers: User[] = [
    user1,
    user2,
    { id: 'user-3', name: 'Citra Lestari', initials: 'CL', avatar: 'https://i.pravatar.cc/150?u=citra' },
    { id: 'user-4', name: 'Dewi Anggraini', initials: 'DA', avatar: 'https://i.pravatar.cc/150?u=dewi' },
    { id: 'user-5', name: 'Eko Prasetyo', initials: 'EP', avatar: 'https://i.pravatar.cc/150?u=eko' },
];

export const dummyUsers: User[] = allUsers;