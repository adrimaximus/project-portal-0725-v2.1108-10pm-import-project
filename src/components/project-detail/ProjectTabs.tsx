import { Button } from "@/components/ui/button";

interface ProjectTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'discussion', label: 'Discussion' },
];

export const ProjectTabs = ({ activeTab, setActiveTab }: ProjectTabsProps) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant="ghost"
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm rounded-none ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
};