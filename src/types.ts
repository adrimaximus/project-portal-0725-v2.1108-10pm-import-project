export interface User {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: string;
}

export interface ReplyToMessage {
  id: string;
  text: string;
  senderName: string;
  isDeleted: boolean;
  attachment?: ChatMessageAttachment;
}

export interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  sender: User;
  attachment?: ChatMessageAttachment;
  replyTo?: ReplyToMessage;
  isDeleted?: boolean;
  isForwarded?: boolean;
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  otherUserId?: string;
  participants: User[];
  createdBy?: string;
  unreadCount: number;
  messages: Message[];
  userName: string;
  last_message_at: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}