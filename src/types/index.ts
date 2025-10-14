export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  initials?: string;
}

export interface Collaborator extends User {}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface RepliedMessage {
  senderName: string;
  content: string;
  isDeleted: boolean;
}

export interface Message {
  id: string;
  text?: string | null;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: RepliedMessage;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  userName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  members: Collaborator[];
  messages: Message[];
}