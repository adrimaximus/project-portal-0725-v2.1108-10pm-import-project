export interface User {
  id: string;
  name: string;
  avatar_url?: string;
  initials: string;
  email?: string;
}

export interface Collaborator extends User {}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface RepliedMessage {
  content: string | null;
  senderName: string;
  isDeleted: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Message {
  id: string;
  text: string | null;
  content?: string | null; // Alias for text
  sender: User;
  timestamp: string;
  attachment?: Attachment;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  reply_to_message_id?: string;
  repliedMessage?: RepliedMessage;
  reactions?: Reaction[];
}