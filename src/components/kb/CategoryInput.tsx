import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
}

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('kb_folders')
    .select('category')
    .not('category', 'is', null);

  if (error) throw error;
  
  const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
  return uniqueCategories as string[];
};

export function CategoryInput({ value, onChange }: CategoryInputProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['kb_folder_categories'],
    queryFn: fetchCategories,
  });

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue)
    setOpen(false)
  }

  const handleCreate = () => {
    if (search && !categories.includes(search)) {
      onChange(search);
      setSearch("");
      setOpen(false);
    }
  }

  const filteredCategories = categories.filter(cat => cat.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? categories.find((category) => category === value) || value
            : "Select or create category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search or create category..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No category found."}
            </CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => handleSelect(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category}
                </CommandItem>
              ))}
              {search && !filteredCategories.some(c => c.toLowerCase() === search.toLowerCase()) && (
                <CommandItem
                  onSelect={handleCreate}
                  className="text-muted-foreground"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{search}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}