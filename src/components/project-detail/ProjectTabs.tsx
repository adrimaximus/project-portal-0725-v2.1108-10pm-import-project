import { Button } from "@/components/ui/button";

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ['overview', 'tasks', 'brief', 'discussion'];

const ProjectTabs = ({ activeTab, onTabChange }: ProjectTabsProps) => (
  <div className="border-b">
    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          onClick={() => onTabChange(tab)}
          className={`whitespace-nowrap capitalize py-4 px-1 border-b-2 font-medium text-sm rounded-none ${
            activeTab === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          {tab}
        </Button>
      ))}
    </nav>
  </div>
);

export default ProjectTabs;