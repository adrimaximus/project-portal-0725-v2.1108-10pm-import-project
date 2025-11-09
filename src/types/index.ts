export interface User {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
}

export interface Collaborator extends User {
  email: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  users: string[];
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

export interface Message {
  id: string;
  sender: User;
  text?: string | null;
  timestamp: string;
  attachment?: Attachment;
  reactions: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
  reply_to_message_id?: string;
  repliedMessage?: RepliedMessage;
}