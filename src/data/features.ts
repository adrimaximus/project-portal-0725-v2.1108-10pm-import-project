export type FeatureStatus = 'enabled' | 'disabled';

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  path: string;
}

// Berdasarkan rute di App.tsx dan fitur aplikasi umum.
export const initialFeatures: Feature[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'The main overview of your projects and activities.',
    status: 'enabled',
    path: '/dashboard',
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Manage your projects and track their progress.',
    status: 'enabled',
    path: '/projects',
  },
  {
    id: 'request',
    name: 'Request Feature',
    description: 'Request new features or improvements.',
    status: 'enabled',
    path: '/request',
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Communicate with your team in real-time.',
    status: 'enabled',
    path: '/chat',
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    description: 'Track your mood and well-being over time.',
    status: 'enabled',
    path: '/mood-tracker',
  },
  {
    id: 'goals',
    name: 'Goals',
    description: 'Set and track personal or team goals.',
    status: 'enabled',
    path: '/goals',
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Manage your subscription and payment methods.',
    status: 'enabled',
    path: '/billing',
  },
  {
    id: 'expense',
    name: 'Expense',
    description: 'Track and manage project-related expenses.',
    status: 'enabled',
    path: '/expense',
  },
  {
    id: 'people',
    name: 'People',
    description: 'Manage your contacts and connections.',
    status: 'enabled',
    path: '/people',
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Create and manage articles and documentation.',
    status: 'enabled',
    path: '/knowledge-base',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Stay updated with important events and alerts.',
    status: 'enabled',
    path: '/notifications',
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Manage your personal information and settings.',
    status: 'enabled',
    path: '/profile',
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Quickly find anything across your workspace.',
    status: 'enabled',
    path: '/search',
  },
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions for your team.',
    status: 'enabled',
    path: '/users',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure application features and preferences.',
    status: 'enabled',
    path: '/settings',
  },
];