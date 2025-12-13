import { Banknote, Building, FileText, Palette, Settings as SettingsIcon, Shapes, Tags, Users, Wallet, Workflow, Plug, Folder, CreditCard, Receipt } from 'lucide-react';

export const settingsLinks = [
  { to: '/settings/workspace', title: 'Workspace', description: 'General workspace settings.', icon: SettingsIcon },
  { to: '/settings/team', title: 'Team', description: 'Manage team members and roles.', icon: Users },
  { to: '/settings/navigation', title: 'Navigation', description: 'Customize the sidebar navigation.', icon: Folder },
  { to: '/settings/theme', title: 'Theme', description: 'Customize the look and feel.', icon: Palette },
  { to: '/settings/integrations', title: 'Integrations', description: 'Connect with other apps.', icon: Plug },
  { to: '/settings/project-statuses', title: 'Project Statuses', description: 'Manage project status options.', icon: Workflow },
  { to: '/settings/payment-statuses', title: 'Payment Statuses', description: 'Manage payment status options.', icon: Banknote },
  { to: '/settings/services', title: 'Services', description: 'Manage predefined project services.', icon: Shapes },
  { to: '/settings/tags', title: 'Tags', description: 'Manage global tags for all categories.', icon: Tags },
  { to: '/settings/bank-accounts', title: 'Bank Accounts', description: 'Manage beneficiary bank accounts.', icon: CreditCard },
  { to: '/settings/properties', title: 'Project Properties', description: 'Customize fields for projects.', icon: FileText },
  { to: '/settings/people-properties', title: 'Contact Properties', description: 'Customize fields for contacts.', icon: Users },
  { to: '/settings/company-properties', title: 'Company Properties', description: 'Customize fields for companies.', icon: Building },
  { to: '/settings/billing-properties', title: 'Billing Properties', description: 'Customize fields for billing.', icon: Wallet },
  { to: '/settings/expense-properties', title: 'Expense Properties', description: 'Customize fields for expenses.', icon: Receipt },
];