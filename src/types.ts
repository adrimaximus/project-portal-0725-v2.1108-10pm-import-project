export interface User {
  id: string;
  name: string;
  avatar_url?: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface Profile extends User {
  // any profile specific fields
}

export interface Message {
  id: string;
  text: string | null;
  createdAt: string | Date;
  sender: User;
  isDeleted?: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  messageType?: string;
  replyTo?: {
    id: string;
    text: string | null;
    senderName: string;
    isDeleted: boolean;
  } | null;
}