export interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string | null;
    sender: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
}