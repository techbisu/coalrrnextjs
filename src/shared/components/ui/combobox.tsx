"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react"

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

export type ComboboxOption = {
  value: string
  label: string
  group?: string
  data?: any
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  onSearch?: (search: string) => void
  placeholder?: string
  emptyText?: string
  isMulti?: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
  /** Max number of badges shown before "+N more" */
  maxBadges?: number
}

export function Combobox({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Select…",
  emptyText = "No options found.",
  isMulti = false,
  isLoading = false,
  disabled = false,
  className,
  maxBadges = 3,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // ── Normalise value ──────────────────────────────────────────────────────
  const selectedValues = React.useMemo(() => {
    if (value === undefined || value === null || value === "") return []
    return Array.isArray(value) ? value.map(String) : [String(value)]
  }, [value])

  const selectedOptions = React.useMemo(
    () => options.filter((o) => selectedValues.includes(String(o.value))),
    [options, selectedValues]
  )

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q)
    onSearch?.(q)
  }

  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
      onSearch?.("")
    }
  }, [open, onSearch])

  // ── Client-side filter (when no onSearch delegate) ───────────────────────
  const filteredOptions = React.useMemo(() => {
    if (onSearch) return options // server/parent controls filtering
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchQuery, onSearch])

  // ── Group ────────────────────────────────────────────────────────────────
  const groupedOptions = React.useMemo(() => {
    return filteredOptions.reduce(
      (acc, option) => {
        const g = option.group || "__default__"
        if (!acc[g]) acc[g] = []
        acc[g].push(option)
        return acc
      },
      {} as Record<string, ComboboxOption[]>
    )
  }, [filteredOptions])

  // ── Select / clear ───────────────────────────────────────────────────────
  const handleSelect = (val: string) => {
    // Find the selected option object
    const optionObj = options.find((o) => String(o.value) === val)

    if (isMulti) {
      const current = [...selectedValues]
      const idx = current.indexOf(val)
      let newValues: string[]
      if (idx > -1) {
        newValues = current.filter((v) => v !== val)
      } else {
        newValues = [...current, val]
      }
      
      const newOptions = options.filter(o => newValues.includes(String(o.value)))
      onChange?.(newValues, newOptions)
    } else {
      onChange?.(val, optionObj)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(isMulti ? [] : "")
  }

  const hasValue = selectedValues.length > 0

  // ── Trigger label ────────────────────────────────────────────────────────
  const triggerLabel = React.useMemo(() => {
    if (!hasValue) return null
    if (isMulti) {
      const visible = selectedOptions.slice(0, maxBadges)
      const overflow = selectedOptions.length - maxBadges
      return (
        <span className="flex flex-wrap items-center gap-1 min-w-0">
          {visible.map((o) => (
            <Badge
              key={o.value}
              variant="secondary"
              className="max-w-[140px] truncate text-[11px] font-normal h-5 px-1.5 rounded-md"
            >
              {o.label}
            </Badge>
          ))}
          {overflow > 0 && (
            <Badge
              variant="outline"
              className="text-[11px] font-medium h-5 px-1.5 rounded-md shrink-0"
            >
              +{overflow}
            </Badge>
          )}
        </span>
      )
    }
    return (
      <span className="truncate text-sm text-foreground">
        {selectedOptions[0]?.label ?? placeholder}
      </span>
    )
  }, [hasValue, isMulti, selectedOptions, maxBadges, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            // Base
            "w-full justify-between h-auto min-h-10 px-3 py-2 gap-2",
            // Typography
            "font-normal text-sm",
            // Transition
            "transition-all duration-150",
            // Focus ring — enterprise standard
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            // Open state
            open && "ring-2 ring-ring ring-offset-1",
            // Placeholder colour
            !hasValue && "text-muted-foreground",
            // Disabled
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {/* Left: value or placeholder */}
          <span className="flex-1 flex items-center gap-1 min-w-0 text-left overflow-hidden">
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </span>
            ) : hasValue ? (
              triggerLabel
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </span>

          {/* Right: clear + chevron */}
          <span className="flex items-center gap-1 shrink-0 ml-1">
            {hasValue && !disabled && !isLoading && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={handleClear}
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm",
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  "transition-colors duration-100 cursor-pointer"
                )}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 shadow-lg border"
        style={{ width: "var(--radix-popover-trigger-width)", minWidth: "220px" }}
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          {/* Search input */}
          <div className="flex items-center border-b px-3 gap-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder="Search…"
              value={searchQuery}
              onValueChange={handleSearch}
              className="h-9 border-0 outline-none focus:ring-0 px-0 text-sm placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Option count hint */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b bg-muted/30">
              {filteredOptions.length} option{filteredOptions.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}

          {/* List — CommandList is the scroll container (standard shadcn pattern) */}
          <CommandList className="max-h-[260px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>
                <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                  <Search className="h-7 w-7 opacity-30" />
                  <p className="text-sm font-medium">
                    {isLoading ? "Loading options…" : emptyText}
                  </p>
                  {searchQuery && !isLoading && (
                    <p className="text-xs opacity-70">
                      Try a different keyword
                    </p>
                  )}
                </div>
              </CommandEmpty>

              {Object.entries(groupedOptions).map(([group, groupOpts]) => (
                <CommandGroup
                  key={group}
                  heading={group !== "__default__" ? group : undefined}
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/70 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {groupOpts.map((option) => {
                    const isSelected = selectedValues.includes(String(option.value))
                    // Split label parts (name | local | code) for styled rendering
                    const parts = option.label.split(" | ")
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => handleSelect(String(option.value))}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-2 cursor-pointer rounded-md mx-1 my-0.5",
                          "transition-colors duration-100",
                          isSelected && "bg-primary/8 text-primary font-medium",
                          "aria-selected:bg-accent"
                        )}
                      >
                        {/* Checkmark */}
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm mt-0.5",
                            "border transition-all duration-100",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>

                        {/* Label — multi-part rendering for name | local | code */}
                        <span className="flex-1 min-w-0">
                          {parts.length > 1 ? (
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium leading-tight truncate">
                                {parts[0]}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {parts.slice(1).join(" · ")}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm truncate">{option.label}</span>
                          )}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>

          {/* Multi-select footer */}
          {isMulti && hasValue && (
            <div className="border-t px-3 py-2 flex items-center justify-between bg-muted/30">
              <span className="text-[11px] text-muted-foreground">
                {selectedValues.length} selected
              </span>
              <button
                onClick={handleClear}
                className="text-[11px] text-destructive hover:underline font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
