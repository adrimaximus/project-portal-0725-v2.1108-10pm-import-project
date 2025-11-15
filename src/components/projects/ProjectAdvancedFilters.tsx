import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterX, User, ListX } from "lucide-react";
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

interface Person {
  id: string;
  name: string;
}

export interface AdvancedFiltersState {
  personId: string | null;
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

  const handlePersonSelect = (personId: string) => {
    const newPersonId = filters.personId === personId ? null : personId;
    onFiltersChange({ ...filters, personId: newPersonId });
  };

  const handleStatusToggle = (statusValue: string) => {
    const currentExcluded = filters.excludedStatus || [];
    const newExcludedStatus = currentExcluded.includes(statusValue)
      ? currentExcluded.filter(s => s !== statusValue)
      : [...currentExcluded, statusValue];
    onFiltersChange({ ...filters, excludedStatus: newExcludedStatus });
  };

  const activeFilterCount = (filters.personId ? 1 : 0) + (filters.excludedStatus?.length || 0);

  const clearFilters = () => {
    onFiltersChange({ personId: null, excludedStatus: [] });
  };

  const allTeam = [...new Map([...allOwners, ...allPeople].map(item => [item['id'], item])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));

  const personFilterContent = (
    <div className="space-y-2">
      <Label>Filter by Person (Owner/Member)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.personId ? allTeam.find(p => p.id === filters.personId)?.name : "Select a person..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search person..." />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                {allTeam.map((person) => (
                  <CommandItem key={person.id} value={person.name} onSelect={() => handlePersonSelect(person.id)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.personId === person.id ? "opacity-100" : "opacity-0")} />
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
      {personFilterContent}
      {statusFilterContent}
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden sm:flex items-center gap-1">
        <TooltipProvider>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(filters.personId && "text-primary bg-muted")}>
                    <User className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter by Person</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4">{personFilterContent}</PopoverContent>
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
            <div className="p-4">{filterContent}</div>
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