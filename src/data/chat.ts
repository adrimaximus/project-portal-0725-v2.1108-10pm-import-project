import { Collaborator, Message, Attachment, User } from "@/types";

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

const me: User = { id: 'me', name: 'You', avatar: 'https://i.pravatar.cc/150?u=me', initials: 'Y' };
const john: User = { id: 'john', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=john', initials: 'JD' };
const jane: User = { id: 'jane', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane', initials: 'JS' };
const alex: User = { id: 'alex', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex', initials: 'A' };
const system: User = { id: 'system', name: 'System', initials: 'S' };

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
        sender: john,
      },
      {
        id: 'msg-2',
        text: "Pretty good! I'm almost done with the new feature.",
        timestamp: "10:31 AM",
        sender: me,
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
        sender: jane,
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
        { id: '1', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex', initials: 'A', online: true },
        { id: '2', name: 'Beth', avatar: 'https://i.pravatar.cc/150?u=beth', initials: 'B', online: false },
        { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'C', online: true },
    ],
    messages: [
      {
        id: 'msg-4',
        text: "Don't forget the meeting at 3 PM.",
        timestamp: "Yesterday",
        sender: alex,
      },
      {
        id: 'msg-5',
        text: "I've attached the agenda.",
        timestamp: "Yesterday",
        sender: alex,
        attachment: {
          name: "meeting-agenda.pdf",
          url: "#",
          type: "file"
        }
      }
    ],
  },
];