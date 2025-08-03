export type Feature = {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'upgrade';
};

// This will be the default state if nothing is in localStorage.
export const defaultFeatures: Feature[] = [
  { 
    id: 'dashboard',
    name: 'Dashboard', 
    description: 'Get a complete overview of all your projects and activities.', 
    status: 'enabled' 
  },
  { 
    id: 'projects',
    name: 'Projects', 
    description: 'Organize your work into distinct projects with tasks and deadlines.', 
    status: 'enabled' 
  },
  { 
    id: 'request',
    name: 'Request', 
    description: 'Submit new work requests through a formal, trackable process.', 
    status: 'enabled' 
  },
  { 
    id: 'chat',
    name: 'Chat', 
    description: 'Real-time communication with your team and collaborators.', 
    status: 'enabled' 
  },
  { 
    id: 'mood-tracker',
    name: 'Mood Tracker', 
    description: 'Log and monitor team morale and well-being over time.', 
    status: 'enabled' 
  },
  { 
    id: 'goals',
    name: 'Goals', 
    description: 'Set, track, and manage project and personal objectives.', 
    status: 'enabled' 
  },
  { 
    id: 'billing',
    name: 'Billing', 
    description: 'Manage invoices, payments, and view your subscription details.', 
    status: 'enabled' 
  },
  { 
    id: 'notifications',
    name: 'Notifications', 
    description: 'Receive timely updates on important activities and mentions.', 
    status: 'enabled' 
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Manage platform features and user profile.',
    status: 'enabled'
  }
];