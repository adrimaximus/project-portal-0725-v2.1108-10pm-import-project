export type Permission = {
  id: string;
  label: string;
  description: string;
};

export type PermissionCategory = {
  id: string;
  label: string;
  permissions: Permission[];
};

export const PERMISSIONS: PermissionCategory[] = [
  {
    id: 'projects',
    label: 'Projects',
    permissions: [
      { id: 'projects:create', label: 'Create Projects', description: 'Allows user to create new projects.' },
      { id: 'projects:read', label: 'View All Projects', description: 'Allows user to view all projects, not just assigned ones.' },
      { id: 'projects:update', label: 'Edit Projects', description: 'Allows user to edit details of any project.' },
      { id: 'projects:delete', label: 'Delete Projects', description: 'Allows user to delete any project.' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    permissions: [
      { id: 'users:invite', label: 'Invite Users', description: 'Allows user to invite new members to the team.' },
      { id: 'users:manage', label: 'Manage User Roles', description: 'Allows user to change roles and suspend members.' },
      { id: 'users:delete', label: 'Delete Users', description: 'Allows user to remove members from the team.' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    permissions: [
      { id: 'settings:access', label: 'Access Settings', description: 'Allows user to view the main settings page.' },
      { id: 'settings:manage_roles', label: 'Manage Roles', description: 'Allows user to create, edit, and delete custom roles.' },
      { id: 'settings:manage_integrations', label: 'Manage Integrations', description: 'Allows user to connect or disconnect third-party apps.' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    permissions: [
      { id: 'billing:access', label: 'Access Billing', description: 'Allows user to view the billing page and invoices.' },
    ],
  },
];