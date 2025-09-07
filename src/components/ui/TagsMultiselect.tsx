import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus, X } from "lucide-react";

// shadcn/ui primitives (Radix under the hood)
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tag } from "@/types";

/**
 * TagsMultiselect Props & Types
 */
export type TagOption = { value: string; label: string; color?: string };

export interface TagsMultiselectProps {
  /** Selected options */
  value: Tag[];
  /** Callback on change */
  onChange: (next: Tag[]) => void;
  /** Available options to pick from */
  options: Tag[];
  /** Callback when a new tag is created */
  onTagCreate?: (label: string) => Tag;
  /** Placeholder on the trigger */
  placeholder?: string;
  /** Allow creating new tags when not found */
  allowCreate?: boolean;
  /** Max height of dropdown list (px or tailwind class via override) */
  maxListHeightClass?: string; // e.g. "max-h-64"
  /** Disabled state */
  disabled?: boolean;
  /** className for the trigger wrapper */
  className?: string;
}

/** Utility */
const normalize = (s: string) => s.trim().toLowerCase();

function uniqueBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = key(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

/**
 * TagsMultiselect: multi-select + creatable + scrollable dropdown.
 * - Keyboard friendly (Command palette style)
 * - Works nicely inside modals (Radix Popover uses Portal)
 * - Smooth micro-interactions with framer-motion
 */
export function TagsMultiselect({
  value,
  onChange,
  options,
  onTagCreate,
  placeholder = "Select or create tags…",
  allowCreate = true,
  maxListHeightClass = "max-h-64",
  disabled,
  className,
}: TagsMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const tagOptions = useMemo(() => options.map(t => ({ value: t.id, label: t.name, color: t.color })), [options]);
  const selectedTagOptions = useMemo(() => value.map(t => ({ value: t.id, label: t.name, color: t.color })), [value]);

  const selectedValuesSet = useMemo(() => new Set(selectedTagOptions.map((t) => normalize(t.value))), [selectedTagOptions]);

  const filtered = useMemo(() => {
    const nq = normalize(query);
    if (!nq) return tagOptions;
    return tagOptions.filter((opt) =>
      normalize(opt.label).includes(nq) || normalize(opt.value).includes(nq)
    );
  }, [tagOptions, query]);

  const existsLabel = (label: string) => options.some((o) => normalize(o.name) === normalize(label));

  function toggleSelect(opt: TagOption) {
    const fullTag = options.find(t => t.id === opt.value);
    if (!fullTag) return;

    const isSelected = selectedValuesSet.has(normalize(opt.value));
    let next: Tag[];
    if (isSelected) {
      next = value.filter((t) => normalize(t.id) !== normalize(opt.value));
    } else {
      next = [...value, fullTag];
    }
    onChange(next);
  }

  function removeTag(val: string) {
    const key = normalize(val);
    onChange(value.filter((t) => normalize(t.id) !== key));
  }

  function clearAll() {
    onChange([]);
  }

  function createTag(label: string) {
    if (!onTagCreate) return;
    const newTag = onTagCreate(label);
    onChange([...value, newTag]);
    setQuery("");
  }

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={"w-full " + (className || "")}> 
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            disabled={!!disabled}
            className={`w-full justify-between gap-2 rounded-lg border-input bg-background px-3 py-2 text-left shadow-sm hover:bg-accent/40 data-[state=open]:ring-2 data-[state=open]:ring-ring ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1">
              <AnimatePresence initial={false}>
                {selectedTagOptions.length === 0 ? (
                  <span className="text-muted-foreground/70">{placeholder}</span>
                ) : (
                  selectedTagOptions.map((tag) => (
                    <motion.span
                      key={tag.value}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Badge
                        variant="secondary"
                        className="group gap-1 rounded-md px-2 py-1 text-xs"
                        style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                      >
                        {tag.label}
                        <button
                          type="button"
                          aria-label={`Remove ${tag.label}`}
                          onClick={(e) => { e.stopPropagation(); removeTag(tag.value); }}
                          className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    </motion.span>
                  ))
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1">
              {selectedTagOptions.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearAll(); }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label="Clear all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-150 data-[state=open]:rotate-180" data-state={open ? "open" : "closed"} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 rounded-xl border bg-popover shadow-xl"
          align="start"
          sideOffset={8}
        >
          <Command shouldFilter={false} className="flex h-full w-full flex-col overflow-hidden rounded-xl">
            <div className="p-2">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Type to search…"
                className="rounded-lg"
              />
            </div>
            <CommandList className={`${maxListHeightClass} overflow-y-auto px-1 pb-2`}>
              <CommandEmpty>
                {allowCreate && query.trim() ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results. Press <kbd className="mx-0.5 rounded border px-1">Enter</kbd> to create.</div>
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results.</div>
                )}
              </CommandEmpty>
              <CommandGroup heading="Tags">
                {filtered.map((opt) => {
                  const active = selectedValuesSet.has(normalize(opt.value));
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      onSelect={() => toggleSelect(opt)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="truncate">{opt.label}</span>
                      {active ? <Check className="h-4 w-4" /> : null}
                    </CommandItem>
                  );
                })}
                {allowCreate && query.trim() && !existsLabel(query) && (
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={() => createTag(query)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create “{query.trim()}”
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}