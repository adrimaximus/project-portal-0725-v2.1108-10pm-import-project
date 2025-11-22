export const PERMISSIONS = [
  {
    id: 'modules',
    label: 'Modules Access',
    permissions: [
      { id: 'module:dashboard', label: 'Dashboard', description: 'Access to dashboard' },
      { id: 'module:projects', label: 'Projects', description: 'Access to projects module' },
      { id: 'module:tasks', label: 'Tasks', description: 'Access to tasks module' },
      { id: 'module:request', label: 'Requests', description: 'Access to requests module' },
      { id: 'module:chat', label: 'Chat', description: 'Access to chat module' },
      { id: 'module:mood-tracker', label: 'Mood Tracker', description: 'Access to mood tracker' },
      { id: 'module:goals', label: 'Goals', description: 'Access to goals module' },
      { id: 'module:billing', label: 'Billing', description: 'Access to billing module' },
      { id: 'module:expense', label: 'Expense', description: 'Access to expense module' },
      { id: 'module:people', label: 'People', description: 'Access to people directory' },
      { id: 'module:publication', label: 'Publication', description: 'Access to publication module' },
      { id: 'module:knowledge-base', label: 'Knowledge Base', description: 'Access to knowledge base' },
      { id: 'module:settings', label: 'Settings', description: 'Access to settings' },
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    permissions: [
      { id: 'projects:view_all', label: 'View All Projects', description: 'View all projects in the workspace' },
      { id: 'projects:create', label: 'Create Projects', description: 'Create new projects' },
      { id: 'projects:edit', label: 'Edit Projects', description: 'Edit projects details' },
      { id: 'projects:edit_all', label: 'Edit All Projects', description: 'Edit any project in the workspace' },
      { id: 'projects:delete', label: 'Delete Projects', description: 'Delete projects' },
      { id: 'projects:delete_all', label: 'Delete All Projects', description: 'Delete any project in the workspace' },
      { id: 'projects:manage_members', label: 'Manage Members', description: 'Add or remove project members' },
    ]
  },
  {
    id: 'tasks',
    label: 'Tasks',
    permissions: [
      { id: 'tasks:view_all', label: 'View All Tasks', description: 'View all tasks across all projects' },
      { id: 'tasks:create', label: 'Create Tasks', description: 'Create new tasks' },
      { id: 'tasks:edit', label: 'Edit Tasks', description: 'Edit tasks' },
      { id: 'tasks:delete', label: 'Delete Tasks', description: 'Delete tasks' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    permissions: [
      { id: 'finance:view_all_expenses', label: 'View All Expenses', description: 'View expenses from all users' },
      { id: 'finance:approve_expenses', label: 'Approve Expenses', description: 'Approve or reject expenses' },
    ]
  }
];