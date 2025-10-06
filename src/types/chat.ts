import { User, Collaborator } from './user';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface RepliedMessageInfo {
  content: string;
  senderName: string;
  isDeleted: boolean;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: RepliedMessageInfo | null;
  reactions?: Reaction[];
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup: boolean;
  members: Collaborator[];
  created_by?: string;
}