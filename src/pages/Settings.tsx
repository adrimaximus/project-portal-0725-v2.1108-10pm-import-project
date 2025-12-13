import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote, Building, FileText, Palette, Settings as SettingsIcon, Shapes, Tags, Users, Wallet, Workflow, Plug, Folder, CreditCard, Receipt } from 'lucide-react';

const settingsLinks = [
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

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace and account settings.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.sort((a, b) => a.title.localeCompare(b.title)).map((link) => (
          <Link to={link.to} key={link.to} className="block hover:bg-muted/50 transition-colors rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
                <link.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;