"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

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
  group?: string // For ComboboxGroup
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  onSearch?: (search: string) => void
  placeholder?: string
  emptyText?: string
  isMulti?: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Select...",
  emptyText = "No options found.",
  isMulti = false,
  isLoading = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleSearch = (search: string) => {
    setSearchQuery(search)
    onSearch?.(search)
  }

  const selectedValues = React.useMemo(() => {
    if (value === undefined || value === null || value === '') return []
    return Array.isArray(value) ? value.map(String) : [String(value)]
  }, [value])

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => selectedValues.includes(String(opt.value)))
  }, [options, selectedValues])

  const groupedOptions = React.useMemo(() => {
    return options.reduce((acc, option) => {
      const group = option.group || "Default"
      if (!acc[group]) acc[group] = []
      acc[group].push(option)
      return acc
    }, {} as Record<string, ComboboxOption[]>)
  }, [options])

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const isSelected = selectedValues.includes(optionValue)
      if (isSelected) {
        onChange?.(selectedValues.filter((v) => v !== optionValue))
      } else {
        onChange?.([...selectedValues, optionValue])
      }
    } else {
      onChange?.(optionValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between h-auto min-h-[40px]",
            (!value || (isMulti && selectedValues.length === 0)) && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
            {isMulti ? (
              selectedOptions.length > 0 ? (
                selectedOptions.map(opt => (
                  <Badge variant="secondary" key={opt.value} className="text-[10px] font-normal px-1.5 py-0">
                    {opt.label}
                  </Badge>
                ))
              ) : placeholder
            ) : (
              selectedOptions.length > 0 ? selectedOptions[0].label : placeholder
            )}
          </div>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput 
            placeholder={`Search...`} 
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : emptyText}</CommandEmpty>
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <CommandGroup key={group} heading={group !== "Default" ? group : undefined}>
                {groupOptions.map((option) => {
                  const isSelected = selectedValues.includes(String(option.value))
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(String(option.value))}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
