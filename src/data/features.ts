export type Feature = {
  name: string;
  description: string;
  status: 'enabled' | 'upgrade';
};

export const features: Feature[] = [
  { 
    name: 'Dashboard', 
    description: 'Get a complete overview of all your projects and activities.', 
    status: 'enabled' 
  },
  { 
    name: 'Projects', 
    description: 'Organize your work into distinct projects with tasks and deadlines.', 
    status: 'enabled' 
  },
  { 
    name: 'Request', 
    description: 'Submit new work requests through a formal, trackable process.', 
    status: 'enabled' 
  },
  { 
    name: 'Chat', 
    description: 'Real-time communication with your team and collaborators.', 
    status: 'enabled' 
  },
  { 
    name: 'Mood Tracker', 
    description: 'Log and monitor team morale and well-being over time.', 
    status: 'enabled' 
  },
  { 
    name: 'Goals', 
    description: 'Set, track, and manage project and personal objectives.', 
    status: 'enabled' 
  },
  { 
    name: 'Billing', 
    description: 'Manage invoices, payments, and view your subscription details.', 
    status: 'enabled' 
  },
  { 
    name: 'Notifications', 
    description: 'Receive timely updates on important activities and mentions.', 
    status: 'enabled' 
  },
  { 
    name: 'Advanced Analytics', 
    description: 'In-depth reports on project performance and team productivity.', 
    status: 'upgrade' 
  },
  { 
    name: 'Custom Branding', 
    description: 'Apply your own company branding to the client portal.', 
    status: 'upgrade' 
  },
  { 
    name: 'API Access', 
    description: 'Integrate the portal with your other tools and services.', 
    status: 'upgrade' 
  },
];