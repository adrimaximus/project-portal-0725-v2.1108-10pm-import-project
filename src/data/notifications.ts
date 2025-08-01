export type Notification = {
  id: string;
  type: 'mention' | 'request' | 'system';
  user: {
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
  read: boolean;
};

export const dummyNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'mention',
    user: {
      name: 'Aria',
      avatar: 'https://i.pravatar.cc/150?u=aria',
    },
    message: 'menyebut Anda dalam obrolan untuk **Project Alpha**.',
    timestamp: '2 jam yang lalu',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'mention',
    user: {
      name: 'Ben',
      avatar: 'https://i.pravatar.cc/150?u=ben',
    },
    message: 'menyebut Anda dalam obrolan untuk **Kampanye Pemasaran Q3**.',
    timestamp: '1 hari yang lalu',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'request',
    user: {
      name: 'Catherine',
      avatar: 'https://i.pravatar.cc/150?u=catherine',
    },
    message: 'telah meminta akses ke file **Pedoman Branding Baru**.',
    timestamp: '3 hari yang lalu',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'mention',
    user: {
      name: 'David',
      avatar: 'https://i.pravatar.cc/150?u=david',
    },
    message: 'menyebut Anda dalam obrolan untuk **Desain Ulang Situs Web**.',
    timestamp: '5 hari yang lalu',
    read: true,
  },
];