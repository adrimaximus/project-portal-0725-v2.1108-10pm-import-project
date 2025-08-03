import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FileText, User, Target, FileCheck2, FolderKanban } from 'lucide-react';
import { dummyProjects } from '@/data/projects';
import { dummyInvoices } from '@/data/invoices';
import { dummyGoals } from '@/data/goals';

// Ekstrak pengguna unik dari proyek
const allUsers = dummyProjects.flatMap(p => p.assignedTo);
const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values());

interface GlobalCommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function GlobalCommandMenu({ open, setOpen }: GlobalCommandMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Projects">
          {dummyProjects.map(project => (
            <CommandItem
              key={project.id}
              value={`Project ${project.name}`}
              onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              <span>{project.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Users">
          {uniqueUsers.map(user => (
            <CommandItem
              key={user.id}
              value={`User ${user.name}`}
              onSelect={() => runCommand(() => navigate(`/chat/${user.id}`))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{user.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Invoices">
          {dummyInvoices.map(invoice => (
            <CommandItem
              key={invoice.id}
              value={`Invoice ${invoice.number} ${invoice.clientName}`}
              onSelect={() => runCommand(() => navigate(`/invoices/${invoice.id}`))}
            >
              <FileCheck2 className="mr-2 h-4 w-4" />
              <span>{invoice.number} - {invoice.clientName}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Goals">
          {dummyGoals.map(goal => (
            <CommandItem
              key={goal.id}
              value={`Goal ${goal.title}`}
              onSelect={() => runCommand(() => navigate(`/goals/${goal.id}`))}
            >
              <Target className="mr-2 h-4 w-4" />
              <span>{goal.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}