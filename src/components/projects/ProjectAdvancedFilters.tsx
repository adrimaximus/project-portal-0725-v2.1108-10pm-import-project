import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, FilterX, ChevronsUpDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Person {
  id: string;
  name: string;
}

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
}

const ProjectAdvancedFilters = ({ filters, onFiltersChange, allPeople, allOwners }: ProjectAdvancedFiltersProps) => {
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

  const filterContent = (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Filter by Project Owner</Label>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
              {filters.ownerIds?.length > 0 ? `${filters.ownerIds.length} owner(s) selected` : "Select owners..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Command className="border rounded-lg">
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
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="space-y-2">
        <Label>Filter by Project Member</Label>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
              {filters.memberIds?.length > 0 ? `${filters.memberIds.length} member(s) selected` : "Select members..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Command className="border rounded-lg">
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
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="space-y-2">
        <Label>Exclude Project Statuses</Label>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
              {filters.excludedStatus?.length > 0 ? `${filters.excludedStatus.length} status(es) excluded` : "Select statuses to exclude..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Command className="border rounded-lg">
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
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden sm:flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(activeFilterCount > 0 && "text-primary bg-muted")}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced Filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-80 p-4">
            {filterContent}
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <FilterX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Clear all filters ({activeFilterCount})</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Mobile View */}
      <div className="sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilterCount}</span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Advanced Filters</DrawerTitle>
              <DrawerDescription>Refine the project list by owner, member, or status.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              {filterContent}
            </div>
            <DrawerFooter className="pt-2 mt-auto">
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