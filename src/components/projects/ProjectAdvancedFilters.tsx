import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterX, UserCog, Users, ListX, List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PROJECT_STATUS_OPTIONS } from "@/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from "lucide-react";
import { Separator } from "../ui/separator";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";

interface Person {
  id: string;
  name: string;
}

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

export interface AdvancedFiltersState {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
}

interface ProjectAdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  allPeople: Person[];
  allOwners: Person[];
  
  // New props for view controls
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (value: 'status' | 'payment_status') => void;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
  isTaskView: boolean;
}

const ProjectAdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  allPeople, 
  allOwners,
  view,
  onViewChange,
  kanbanGroupBy,
  onKanbanGroupByChange,
  hideCompletedTasks,
  onToggleHideCompleted,
  isTaskView,
}: ProjectAdvancedFiltersProps) => {
  const [open, setOpen] = useState(false);

  const handleOwnerToggle = (personId: string) => {
    const currentOwners = filters.ownerIds || [];
    const newOwnerIds = currentOwners.includes(personId)
      ? currentOwners.filter(id => id !== personId)
      : [...currentOwners, personId];
    onFiltersChange({ ...filters, ownerIds: newOwnerIds });
  };

  const handleMemberToggle = (personId: string) => {
    const currentMembers = filters.memberIds || [];
    const newMemberIds = currentMembers.includes(personId)
      ? currentMembers.filter(id => id !== personId)
      : [...currentMembers, personId];
    onFiltersChange({ ...filters, memberIds: newMemberIds });
  };

  const handleStatusToggle = (statusValue: string) => {
    const currentExcluded = filters.excludedStatus || [];
    const newExcludedStatus = currentExcluded.includes(statusValue)
      ? currentExcluded.filter(s => s !== statusValue)
      : [...currentExcluded, statusValue];
    onFiltersChange({ ...filters, excludedStatus: newExcludedStatus });
  };

  const activeFilterCount = (filters.ownerIds?.length || 0) + (filters.memberIds?.length || 0) + (filters.excludedStatus?.length || 0);

  const clearFilters = () => {
    onFiltersChange({ ownerIds: [], memberIds: [], excludedStatus: [] });
  };

  const ownerFilterContent = (
    <div className="space-y-2">
      <Label>Filter by Project Owner</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.ownerIds?.length > 0 ? `${filters.ownerIds.length} owner(s) selected` : "Select owners..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search person..." />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                {allOwners.map((person) => (
                  <CommandItem key={person.id} value={person.name} onSelect={() => handleOwnerToggle(person.id)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.ownerIds?.includes(person.id) ? "opacity-100" : "opacity-0")} />
                    {person.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const memberFilterContent = (
    <div className="space-y-2">
      <Label>Filter by Project Member</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.memberIds?.length > 0 ? `${filters.memberIds.length} member(s) selected` : "Select members..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search person..." />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                {allPeople.map((person) => (
                  <CommandItem key={person.id} value={person.name} onSelect={() => handleMemberToggle(person.id)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.memberIds?.includes(person.id) ? "opacity-100" : "opacity-0")} />
                    {person.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const statusFilterContent = (
    <div className="space-y-2">
      <Label>Exclude Project Statuses</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.excludedStatus?.length > 0 ? `${filters.excludedStatus.length} status(es) excluded` : "Select statuses to exclude..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandList>
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <CommandItem key={status.value} value={status.label} onSelect={() => handleStatusToggle(status.value)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.excludedStatus?.includes(status.value) ? "opacity-100" : "opacity-0")} />
                    {status.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const filterContent = (
    <div className="grid gap-4">
      {ownerFilterContent}
      {memberFilterContent}
      {statusFilterContent}
    </div>
  );

  const viewControls = (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="Project view">
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent><p>List view</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="table" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent><p>Grid view</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="kanban" aria-label="Kanban view"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent><p>Kanban view</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="tasks" aria-label="Tasks list view"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent><p>Tasks list view</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent><p>Tasks kanban view</p></TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>

      {view === 'kanban' && (
        <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
          <SelectTrigger className="w-[80px]"><SelectValue placeholder="Group by..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="payment_status">Payment Status</SelectItem>
          </SelectContent>
        </Select>
      )}
      {isTaskView && (
        <div className="flex items-center space-x-2">
          <Switch id="hide-completed" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} />
          <Label htmlFor="hide-completed" className="text-sm">Hide Done</Label>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden sm:flex items-center gap-1">
        <TooltipProvider>
          
          {/* 1. View Controls */}
          {viewControls}
          
          {/* Separator */}
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 2. Filters */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(filters.ownerIds?.length > 0 && "text-primary bg-muted")}>
                    <UserCog className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter by Project Owner</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4">{ownerFilterContent}</PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(filters.memberIds?.length > 0 && "text-primary bg-muted")}>
                    <Users className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter by Project Member</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4">{memberFilterContent}</PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(filters.excludedStatus?.length > 0 && "text-primary bg-muted")}>
                    <ListX className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exclude Project Statuses</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4">{statusFilterContent}</PopoverContent>
          </Popover>

          {activeFilterCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <FilterX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Clear all filters ({activeFilterCount})</p></TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <FilterX className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilterCount}</span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Advanced Filters</DrawerTitle>
              <DrawerDescription>Refine the project list by owner, member, or status.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-4">{viewControls}</div>
              <Separator />
              {filterContent}
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild><Button>Apply</Button></DrawerClose>
              {activeFilterCount > 0 && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default ProjectAdvancedFilters;