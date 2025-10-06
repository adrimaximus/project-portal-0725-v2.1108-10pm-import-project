export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  email?: string;
}

export interface Message {
  id: string;
  sender: User;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  };
  reactions?: { emoji: string; user_id: string; user_name: string }[];
  conversation_id: string;
  reply_to_message_id?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar_url: string;
  members: Collaborator[];
  is_group: boolean;
  last_message?: {
    content: string;
    timestamp: string;
  };
}