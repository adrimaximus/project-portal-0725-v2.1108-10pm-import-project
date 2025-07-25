import { Collaborator } from "@/types";
import { collaborators } from "@/data/collaborators";

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  avatar: string;
  attachment?: {
    name:string;
    url: string;
    type: 'image' | 'file';
  };
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup?: boolean;
  members?: Collaborator[];
}

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    userName: "Olivia Martin",
    userAvatar: "https://i.pravatar.cc/150?u=olivia",
    lastMessage: "Hey, how's it going? Did you see the latest designs?",
    lastMessageTimestamp: "10:42 AM",
    unreadCount: 2,
    messages: [
      { id: 'msg-1', text: "Hey, how's it going? Did you see the latest designs?", sender: 'Olivia Martin', timestamp: '10:42 AM', avatar: 'https://i.pravatar.cc/150?u=olivia' },
      { id: 'msg-2', text: "I did! They look great. I have a few minor suggestions.", sender: 'You', timestamp: '10:43 AM', avatar: 'https://github.com/shadcn.png' },
    ],
  },
  {
    id: "conv-2",
    userName: "Jackson Lee",
    userAvatar: "https://i.pravatar.cc/150?u=jackson",
    lastMessage: "Can you send over the project brief again? I can't find it.",
    lastMessageTimestamp: "9:15 AM",
    unreadCount: 0,
    messages: [],
  },
  {
    id: "conv-3",
    userName: "Project Alpha Team",
    userAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Project%20Alpha%20Team",
    lastMessage: "Liam: Don't forget our sync-up call at 3 PM today.",
    lastMessageTimestamp: "Yesterday",
    unreadCount: 0,
    isGroup: true,
    messages: [],
    members: collaborators.filter(c => ['Ethan Carter', 'Liam Goldberg'].includes(c.name))
  },
];