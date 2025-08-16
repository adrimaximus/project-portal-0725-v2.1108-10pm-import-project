import { useState } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Project } from '@/types';
import { analyzeProjects, diagnoseProjectVisibility } from '@/lib/openai';
import { toast } from 'sonner';
import { Activity, AlertTriangle, Loader2, ShieldQuestion } from 'lucide-react';

interface ProjectAiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

const aiActions = [
  { id: 'summarize_health', label: 'Summarize project health', icon: Activity },
  { id: 'find_overdue', label: 'Find overdue projects', icon: AlertTriangle },
  { id: 'diagnose_visibility', label: "Diagnose why projects aren't showing", icon: ShieldQuestion },
];

export function ProjectAiAssistant({ open, onOpenChange, projects }: ProjectAiAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAction = async (actionId: string) => {
    setIsLoading(true);
    const toastId = toast.loading("AI is analyzing...", {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
    });

    try {
      let result;
      if (actionId === 'diagnose_visibility') {
        result = await diagnoseProjectVisibility();
      } else {
        result = await analyzeProjects(projects, actionId);
      }
      
      toast.success("AI Analysis Complete", {
        id: toastId,
        description: <div className="prose prose-sm max-w-none"><pre className="whitespace-pre-wrap font-sans">{result}</pre></div>,
        duration: Infinity,
        closeButton: true,
      });
    } catch (error: any) {
      toast.error("AI analysis failed", {
        id: toastId,
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="What can I help you with?" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="AI Actions">
          {aiActions.map(action => (
            <CommandItem
              key={action.id}
              onSelect={() => handleSelectAction(action.id)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}