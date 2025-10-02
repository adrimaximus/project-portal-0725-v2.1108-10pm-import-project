export const PERMISSIONS = [
  {
    id: 'modules',
    label: 'Module Access',
    permissions: [
      { id: 'module:dashboard', label: 'Dashboard', description: 'Access the Dashboard module.' },
      { id: 'module:projects', label: 'Projects', description: 'Access the Projects module.' },
      { id: 'module:tasks', label: 'Tasks', description: 'Access the Tasks module.' },
      { id: 'module:request', label: 'Requests', description: 'Access the Requests module.' },
      { id: 'module:chat', label: 'Chat', description: 'Access the Chat module.' },
      { id: 'module:mood-tracker', label: 'Mood Tracker', description: 'Access the Mood Tracker module.' },
      { id: 'module:goals', label: 'Goals', description: 'Access the Goals module.' },
      { id: 'module:billing', label: 'Billing', description: 'Access the Billing module.' },
      { id: 'module:people', label: 'People', description: 'Access the People module.' },
      { id: 'module:knowledge-base', label: 'Knowledge Base', description: 'Access the Knowledge Base module.' },
      { id: 'module:settings', label: 'Settings', description: 'Access the Settings module.' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    permissions: [
      { id: 'projects:create', label: 'Create Projects', description: 'Allow users to create new projects.' },
      { id: 'projects:delete', label: 'Delete Projects', description: 'Allow users to delete projects they own.' },
      { id: 'projects:edit', label: 'Edit Project Details', description: 'Allow users to edit details of projects they are a member of.' },
      { id: 'projects:manage_members', label: 'Manage Project Members', description: 'Allow users to add or remove members from projects they own.' },
      { id: 'projects:view_all', label: 'View All Projects', description: 'Allow users to see all projects, not just those they are a member of.' },
      { id: 'projects:view_value', label: 'View Project Value', description: 'Allow users to see the project budget/value. If unchecked, the value will be hidden.' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    permissions: [
      { id: 'tasks:create', label: 'Create Tasks', description: 'Allow users to create new tasks within their projects.' },
      { id: 'tasks:delete', label: 'Delete Tasks', description: 'Allow users to delete tasks within their projects.' },
      { id: 'tasks:edit', label: 'Edit Tasks', description: 'Allow users to edit tasks within their projects.' },
      { id: 'tasks:assign', label: 'Assign Tasks', description: 'Allow users to assign tasks to other project members.' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    permissions: [
      { id: 'settings:access', label: 'Access Settings', description: 'Allow users to access the main settings page.' },
      { id: 'settings:manage_workspace', label: 'Manage Workspace', description: 'Allow users to change workspace-level settings.' },
      { id: 'settings:manage_roles', label: 'Manage Roles & Permissions', description: 'Allow users to create, edit, and delete roles.' },
      { id: 'settings:manage_users', label: 'Manage Users', description: 'Allow users to invite, remove, and manage users in the workspace.' },
      { id: 'settings:manage_billing', label: 'Manage Billing', description: 'Allow users to access and manage billing information.' },
      { id: 'settings:manage_integrations', label: 'Manage Integrations', description: 'Allow users to manage workspace integrations.' },
    ],
  },
];