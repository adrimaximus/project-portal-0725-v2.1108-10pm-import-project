import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterX, Building, Tag as TagIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from "lucide-react";
import { Separator } from "../ui/separator";
import { Tag, Company } from "@/types";

export interface PeopleAdvancedFiltersState {
  tagIds: string[];
  companyIds: string[];
}

interface PeopleAdvancedFiltersProps {
  filters: PeopleAdvancedFiltersState;
  onFiltersChange: (filters: PeopleAdvancedFiltersState) => void;
  allTags: Tag[];
  allCompanies: Company[];
}

const PeopleAdvancedFilters = ({ filters, onFiltersChange, allTags, allCompanies }: PeopleAdvancedFiltersProps) => {
  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tagIds || [];
    const newTagIds = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    onFiltersChange({ ...filters, tagIds: newTagIds });
  };

  const handleCompanyToggle = (companyId: string) => {
    const currentCompanies = filters.companyIds || [];
    const newCompanyIds = currentCompanies.includes(companyId)
      ? currentCompanies.filter(id => id !== companyId)
      : [...currentCompanies, companyId];
    onFiltersChange({ ...filters, companyIds: newCompanyIds });
  };

  const activeFilterCount = (filters.tagIds?.length || 0) + (filters.companyIds?.length || 0);

  const clearFilters = () => {
    onFiltersChange({ tagIds: [], companyIds: [] });
  };

  const tagFilterContent = (
    <div className="space-y-2">
      <p className="font-medium text-sm">Filter by Tags</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.tagIds?.length > 0 ? `${filters.tagIds.length} tag(s) selected` : "Select tags..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem key={tag.id} value={tag.name} onSelect={() => handleTagToggle(tag.id)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.tagIds?.includes(tag.id) ? "opacity-100" : "opacity-0")} />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const companyFilterContent = (
    <div className="space-y-2">
      <p className="font-medium text-sm">Filter by Company</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {filters.companyIds?.length > 0 ? `${filters.companyIds.length} company(s) selected` : "Select companies..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search companies..." />
            <CommandList>
              <CommandEmpty>No companies found.</CommandEmpty>
              <CommandGroup>
                {allCompanies.map((company) => (
                  <CommandItem key={company.id} value={company.name} onSelect={() => handleCompanyToggle(company.id)}>
                    <Check className={cn("mr-2 h-4 w-4", filters.companyIds?.includes(company.id) ? "opacity-100" : "opacity-0")} />
                    {company.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(filters.tagIds?.length > 0 && "text-primary bg-muted")}>
                  <TagIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter by Tags</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-4">{tagFilterContent}</PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(filters.companyIds?.length > 0 && "text-primary bg-muted")}>
                  <Building className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter by Company</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-4">{companyFilterContent}</PopoverContent>
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
  );
};

export default PeopleAdvancedFilters;