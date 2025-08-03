import { Collaborator } from "@/types";

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  attachment?: Attachment;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  messages: Message[];
  members?: Collaborator[];
}

const currentUser = {
  id: 'user-alex',
  name: 'Alex',
  avatar: 'https://i.pravatar.cc/150?u=alex'
};

export const dummyConversations: Conversation[] = [
  {
    id: 'convo-1',
    userName: 'Budi',
    userAvatar: 'https://i.pravatar.cc/150?u=budi',
    lastMessage: 'Oke, saya akan cek sekarang.',
    lastMessageTimestamp: '10:40 AM',
    unreadCount: 2,
    isGroup: false,
    messages: [
      { id: 'msg-1-1', senderId: 'user-budi', senderName: 'Budi', senderAvatar: 'https://i.pravatar.cc/150?u=budi', text: 'Hey Alex, apa kabar?', timestamp: '10:38 AM' },
      { id: 'msg-1-2', senderId: currentUser.id, senderName: currentUser.name, senderAvatar: currentUser.avatar, text: 'Baik, Budi. Kamu gimana?', timestamp: '10:39 AM' },
      { id: 'msg-1-3', senderId: 'user-budi', senderName: 'Budi', senderAvatar: 'https://i.pravatar.cc/150?u=budi', text: 'Bisa tolong cek laporan penjualan terakhir?', timestamp: '10:39 AM' },
      { id: 'msg-1-4', senderId: 'user-budi', senderName: 'Budi', senderAvatar: 'https://i.pravatar.cc/150?u=budi', text: 'Oke, saya akan cek sekarang.', timestamp: '10:40 AM' },
    ],
  },
  {
    id: 'convo-2',
    userName: 'Project Alpha Team',
    userAvatar: '', // For group chat, we use a generic icon
    lastMessage: 'Jangan lupa meeting jam 3 sore ya.',
    lastMessageTimestamp: 'Kemarin',
    unreadCount: 0,
    isGroup: true,
    members: [
      { id: 'user-cindy', name: 'Cindy', email: 'cindy@example.com', avatar: 'https://i.pravatar.cc/150?u=cindy', initials: 'C', online: true },
      { id: 'user-dodi', name: 'Dodi', email: 'dodi@example.com', avatar: 'https://i.pravatar.cc/150?u=dodi', initials: 'D', online: false },
      { id: currentUser.id, name: currentUser.name, email: 'alex@example.com', avatar: currentUser.avatar, initials: 'A', online: true },
    ],
    messages: [
      { id: 'msg-2-1', senderId: 'user-cindy', senderName: 'Cindy', senderAvatar: 'https://i.pravatar.cc/150?u=cindy', text: 'Tim, laporan mingguan sudah saya kirim ke email.', timestamp: 'Kemarin' },
      { id: 'msg-2-2', senderId: 'user-dodi', senderName: 'Dodi', senderAvatar: 'https://i.pravatar.cc/150?u=dodi', text: 'Siap, sudah saya terima. Thanks Cindy!', timestamp: 'Kemarin' },
      { id: 'msg-2-3', senderId: 'user-cindy', senderName: 'Cindy', senderAvatar: 'https://i.pravatar.cc/150?u=cindy', text: 'Jangan lupa meeting jam 3 sore ya.', timestamp: 'Kemarin' },
    ],
  },
];

export const currentUserId = currentUser.id;