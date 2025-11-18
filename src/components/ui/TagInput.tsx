"use client"

import React from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"

type Tag = Record<"value" | "label", string>

export function TagInput({
  placeholder,
  tags,
  setTags,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
  tags: Tag[]
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = React.useCallback(
    (tag: Tag) => {
      setTags((prev) => prev.filter((s) => s.value !== tag.value))
    },
    [setTags]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setTags((prev) => {
              const newTags = [...prev]
              newTags.pop()
              return newTags
            })
          }
        }
        if (e.key === "Escape") {
          input.blur()
        }
      }
    },
    [setTags]
  )

  return (
    <div>
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            return (
              <Badge key={tag.value} variant="secondary">
                {tag.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(tag)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(tag)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <CommandPrimitive
            onKeyDown={handleKeyDown}
            className="overflow-visible bg-transparent"
          >
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              {...props}
            />
          </CommandPrimitive>
        </div>
      </div>
    </div>
  )
}