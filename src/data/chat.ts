import { Collaborator } from "@/types";

export interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: "me" | "other";
  senderName: string;
  senderAvatar: string;
  attachment?: Attachment;
}

export interface Conversation {
  id: string;
  userName: string; // For groups, this will be the group name
  userAvatar?: string; // Optional for groups
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup?: boolean;
  members?: Collaborator[];
}

export const dummyConversations: Conversation[] = [
  {
    id: "1",
    userName: "John Doe",
    userAvatar: "https://i.pravatar.cc/150?u=john",
    lastMessage: "Hey, how's the project going?",
    lastMessageTimestamp: "10:30 AM",
    unreadCount: 2,
    isGroup: false,
    messages: [
      {
        id: 'msg-1',
        text: "Hey, how's the project going?",
        timestamp: "10:30 AM",
        sender: "other",
        senderName: "John Doe",
        senderAvatar: "https://i.pravatar.cc/150?u=john",
      },
      {
        id: 'msg-2',
        text: "Pretty good! I'm almost done with the new feature.",
        timestamp: "10:31 AM",
        sender: "me",
        senderName: "You",
        senderAvatar: "https://i.pravatar.cc/150?u=me",
      },
    ],
  },
  {
    id: "2",
    userName: "Jane Smith",
    userAvatar: "https://i.pravatar.cc/150?u=jane",
    lastMessage: "Can you send me the report?",
    lastMessageTimestamp: "Yesterday",
    unreadCount: 0,
    isGroup: false,
    messages: [
      {
        id: 'msg-3',
        text: "Can you send me the report?",
        timestamp: "Yesterday",
        sender: "other",
        senderName: "Jane Smith",
        senderAvatar: "https://i.pravatar.cc/150?u=jane",
      },
    ],
  },
  {
    id: "3",
    userName: "Project Team",
    lastMessage: "I've attached the agenda.",
    lastMessageTimestamp: "Yesterday",
    unreadCount: 5,
    isGroup: true,
    members: [
        { id: '1', name: 'Alex', src: 'https://i.pravatar.cc/150?u=alex', fallback: 'A', online: true },
        { id: '2', name: 'Beth', src: 'https://i.pravatar.cc/150?u=beth', fallback: 'B', online: false },
        { id: '3', name: 'Charlie', src: 'https://i.pravatar.cc/150?u=charlie', fallback: 'C', online: true },
    ],
    messages: [
      {
        id: 'msg-4',
        text: "Don't forget the meeting at 3 PM.",
        timestamp: "Yesterday",
        sender: "other",
        senderName: "Alex",
        senderAvatar: "https://i.pravatar.cc/150?u=alex",
      },
      {
        id: 'msg-5',
        text: "I've attached the agenda.",
        timestamp: "Yesterday",
        sender: "other",
        senderName: "Alex",
        senderAvatar: "https://i.pravatar.cc/150?u=alex",
        attachment: {
          name: "meeting-agenda.pdf",
          url: "#",
          type: "file"
        }
      }
    ],
  },
];