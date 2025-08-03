export type Feature = {
  name: string;
  description: string;
  status: 'enabled' | 'upgrade';
};

export const features: Feature[] = [
  { name: 'Agents', description: 'AI assistants that can help automate tasks and workflows', status: 'enabled' },
  { name: 'Project Roles', description: 'Control who can view, edit, or manage different projects', status: 'enabled' },
  { name: 'Team Collaboration via Git', description: 'Work together on projects with version control and team features', status: 'upgrade' },
  { name: 'Analytics', description: 'View reports and insights about your workflow performance', status: 'upgrade' },
  { name: 'Audit Log', description: 'Track all changes and activities in your workspace', status: 'upgrade' },
  { name: 'Embedding', description: 'Add workflows directly into your website or application', status: 'upgrade' },
  { name: 'Global Connections', description: 'Create centralized connections for your projects', status: 'upgrade' },
  { name: 'Manage Pieces', description: 'Create and organize custom building blocks for workflows', status: 'upgrade' },
  { name: 'Manage Templates', description: 'Save and share workflow templates across your team', status: 'upgrade' },
  { name: 'Brand Activepieces', description: 'Customize the look and feel with your company branding', status: 'upgrade' },
  { name: 'Manage Projects', description: 'Organize workflows into separate projects and workspaces', status: 'upgrade' },
  { name: 'Custom Domains', description: 'Use your own web address instead of the default domain', status: 'upgrade' },
  { name: 'API Keys', description: 'Connect external services and applications to your workflows', status: 'upgrade' },
  { name: 'Single Sign On', description: 'Log in using your company account without separate passwords', status: 'upgrade' },
  { name: 'Custom Roles', description: 'Create and manage custom roles for your team', status: 'upgrade' },
];