import { ChevronsUpDown } from "lucide-react"
import React, { useEffect, useState } from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/Select"

export interface Option {
  label: string
  value: any
}

export interface CustomSelectProps {
  placeholder: React.ReactNode
  selectedComponent: React.ComponentType<{ value: any; label: string }>
  noOptionsComponent?: React.ComponentType
  options: Option[]
  selectedValue?: Option
  isMulti: boolean
  isSearchable: boolean
  keepOpen?: boolean
  onOpen?: (value: Option | Option[]) => void
  onChange: (value: Option | Option[]) => void
  onBlur?: () => void
  align: "left" | "right"
  optionComponent: React.ComponentType<{
    options?: Option[]
    option: Option
    selected: boolean
    onClick: () => void
  }>
}

export function CustomSelect({
  placeholder,
  selectedComponent: SelectedComponent = ({ value }) => <span>{value}</span>,
  options,
  isMulti,
  isSearchable = false,
  noOptionsComponent: NoOptionsComponent,
  keepOpen = false,
  selectedValue: initialValue,
  onChange,
  onOpen,
  onBlur,
  align,
  optionComponent: OptionComponent = ({ option, selected, onClick }) => (
    <span
      onClick={onClick}
      className={selected ? "custom--dropdown-container" : ""}>
      {option.label}
    </span>
  )
}: CustomSelectProps) {
  const [selectedValues, setSelectedValues] = useState<Option[]>([])
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    setSelectedValues(initialValue ? [initialValue] : [])
  }, [initialValue])

  const handleValueChange = (value: string) => {
    const selectedOption = options.find((option) => option.value === value)
    if (selectedOption) {
      let newValue: Option[]
      if (isMulti) {
        newValue = selectedValues.some((o) => o.value === selectedOption.value)
          ? selectedValues.filter((o) => o.value !== selectedOption.value)
          : [...selectedValues, selectedOption]
      } else {
        newValue = [selectedOption]
      }
      setSelectedValues(newValue)
      onChange(isMulti ? newValue : newValue[0])
    }
  }

  const getOptions = () => {
    if (!searchValue) {
      return options
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }

  const renderNoOptions = () => {
    return <>{<NoOptionsComponent /> || <div>No options</div>}</>
  }

  return (
    <div className="CustomSelect">
      <Select
        onValueChange={handleValueChange}
        value={selectedValues[0]?.value}
        onOpenChange={(open) => {
          if (open) onOpen?.(selectedValues)
        }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedValues.length ? (
              <SelectedComponent
                value={selectedValues[0].value}
                label={selectedValues[0].label}
              />
            ) : (
              placeholder
            )}
          </SelectValue>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </SelectTrigger>
        <SelectContent align={align as "start" | "center" | "end"}>
          <SelectGroup>
            {isSearchable && (
              <div className="search-box p-2">
                <input
                  className="form-control w-full"
                  onChange={(e) => setSearchValue(e.target.value)}
                  value={searchValue}
                  placeholder="Search..."
                />
              </div>
            )}
            {getOptions().length > 0
              ? getOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <OptionComponent
                      option={option}
                      options={options}
                      selected={selectedValues.some(
                        (o) => o.value === option.value
                      )}
                      onClick={() => {}}
                    />
                  </SelectItem>
                ))
              : renderNoOptions()}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
