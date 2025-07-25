export type Message = {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
};

export type Conversation = {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
};

export const dummyConversations: Conversation[] = [
  {
    id: 'conv-1',
    userName: 'Jane Doe',
    userAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    lastMessage: 'Tentu, saya akan segera memberitahu Anda tentang itu.',
    lastMessageTimestamp: '10:40 AM',
    unreadCount: 2,
    messages: [
      { id: 'msg-1-1', text: 'Hei, bisakah Anda memeriksa desain terbaru?', sender: 'other', timestamp: '10:30 AM' },
      { id: 'msg-1-2', text: 'Ya, saya sedang mengerjakannya. Akan segera mengirimkan umpan balik.', sender: 'me', timestamp: '10:32 AM' },
      { id: 'msg-1-3', text: 'Bagus, terima kasih!', sender: 'other', timestamp: '10:33 AM' },
      { id: 'msg-1-4', text: 'Juga, tolong periksa faktur yang saya kirim kemarin.', sender: 'other', timestamp: '10:39 AM' },
    ],
  },
  {
    id: 'conv-2',
    userName: 'John Smith',
    userAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    lastMessage: 'Anda: Oke, kedengarannya bagus!',
    lastMessageTimestamp: 'Kemarin',
    unreadCount: 0,
    messages: [
       { id: 'msg-2-1', text: 'Proyek berjalan dengan baik. Kita sesuai jadwal.', sender: 'other', timestamp: 'Kemarin' },
       { id: 'msg-2-2', text: 'Oke, kedengarannya bagus!', sender: 'me', timestamp: 'Kemarin' },
    ],
  },
  {
    id: 'conv-3',
    userName: 'Peter Jones',
    userAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    lastMessage: 'Bisakah kita menjadwalkan pertemuan besok?',
    lastMessageTimestamp: 'Selasa',
    unreadCount: 0,
    messages: [
        { id: 'msg-3-1', text: 'Bisakah kita menjadwalkan pertemuan besok?', sender: 'other', timestamp: 'Selasa' },
    ],
  },
];