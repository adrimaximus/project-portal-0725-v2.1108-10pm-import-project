interface User {
    name: string;
    avatar: string;
}

interface Comment {
    id: number;
    user: User;
    timestamp: string;
    text: string;
    isTicket?: boolean;
    projectId: string;
}

export const initialComments: Comment[] = [
    {
        id: 1,
        user: { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        text: 'This is a comment for project 1.',
        projectId: 'proj-1',
    },
    {
        id: 2,
        user: { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        text: 'This is another comment for project 1.',
        projectId: 'proj-1',
    },
    {
        id: 3,
        user: { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        text: 'This is a comment for project 2.',
        projectId: 'proj-2',
    },
    {
        id: 4,
        user: { name: 'Diana', avatar: 'https://i.pravatar.cc/150?u=diana' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        text: 'This is a comment for project 3.',
        projectId: 'proj-3',
    },
];