import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

export interface Tag {
  id: string
  name: string
  color: string
}

interface TagsMultiselectProps {
  value?: string[] // Array of tag IDs
  onChange?: (value: string[]) => void
  options: Tag[]
  placeholder?: string
  className?: string
}

export function TagsMultiselect({
  value = [],
  onChange,
  options,
  placeholder = "Select tags...",
  className,
}: TagsMultiselectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [width, setWidth] = React.useState(0)

  // Sync popover width with trigger width
  React.useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
  }, [open, triggerRef.current])

  const selected = value.map((id) => options.find((tag) => tag.id === id)).filter(Boolean) as Tag[]

  const handleSelect = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange?.(value.filter((id) => id !== tagId))
    } else {
      onChange?.([...value, tagId])
    }
  }

  const handleRemove = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    onChange?.(value.filter((id) => id !== tagId))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10 py-2", className)}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
            {selected.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="group gap-1 rounded-md px-2 py-1 text-xs font-normal border transition-colors hover:bg-secondary/80"
                style={{ 
                  backgroundColor: tag.color ? `${tag.color}20` : undefined, 
                  borderColor: tag.color || undefined, 
                  color: tag.color || undefined 
                }}
              >
                {tag.name}
                <div
                  role="button"
                  tabIndex={0}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(e as any, tag.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => handleRemove(e, tag.id)}
                >
                  <X className="h-3 w-3 hover:text-foreground/80" />
                </div>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: width ? `${width}px` : "auto" }}>
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleSelect(tag.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: tag.color }} 
                    />
                    <span>{tag.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value.includes(tag.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default TagsMultiselect