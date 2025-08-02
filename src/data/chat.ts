export const dummyUsers = [
  { id: 'user-1', name: 'You', avatar: '/avatars/01.png', initials: 'YOU', online: true },
  { id: 'user-2', name: 'Alice', avatar: '/avatars/02.png', initials: 'A', online: true },
  { id: 'user-3', name: 'Bob', avatar: '/avatars/03.png', initials: 'B', online: false },
  { id: 'user-4', name: 'Charlie', avatar: '/avatars/04.png', initials: 'C', online: true },
];

export const dummyConversations = [
  {
    id: 'convo-1',
    participants: ['user-1', 'user-2'],
    unreadCount: 2,
    messages: [
      { id: 'msg-1', sender: 'user-2', content: 'Hey, how is the project going?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: 'msg-2', sender: 'user-1', content: 'Pretty good! Just wrapping up the dashboard.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
      { id: 'msg-3', sender: 'user-2', content: 'Great to hear!', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: 'msg-4', sender: 'user-2', content: 'Let me know if you need help with the charts.', timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString() },
    ],
  },
  {
    id: 'convo-2',
    participants: ['user-1', 'user-3'],
    unreadCount: 0,
    messages: [
      { id: 'msg-5', sender: 'user-3', content: 'Can you check the latest invoice?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
      { id: 'msg-6', sender: 'user-1', content: 'Sure, I will take a look this afternoon.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5).toISOString() },
    ],
  },
  {
    id: 'convo-3',
    participants: ['user-1', 'user-4'],
    unreadCount: 1,
    messages: [
      { id: 'msg-7', sender: 'user-4', content: 'Meeting at 3 PM today.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    ],
  },
];