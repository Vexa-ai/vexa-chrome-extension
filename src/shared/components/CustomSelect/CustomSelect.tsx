import React, { useEffect, useRef, useState } from "react"

import "./CustomSelect.scss"

import { ChevronsUpDown } from "lucide-react"

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
      className={selected && "custom--dropdown-container"}>
      {option.label}
    </span>
  )
}: CustomSelectProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const [selectedValues, setSelectedValues] = useState<Option[]>([])
  const [searchValue, setSearchValue] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchValue("")
    if (showMenu) {
      onOpen?.(selectedValues)
      if (searchRef.current) {
        searchRef.current.focus()
      }
    }
  }, [showMenu])

  useEffect(() => {
    setShowMenu(keepOpen)
  }, [keepOpen])

  useEffect(() => {
    setSelectedValues(initialValue ? [initialValue] : [])
  }, [initialValue])

  const handleInputClick = () => {
    setShowMenu((prev) => !prev)
  }

  const removeOption = (option: Option) => {
    return selectedValues.filter((o) => o.value !== option.value)
  }

  const onItemClick = (option: Option) => {
    let newValue
    if (isMulti) {
      if (selectedValues.some((o) => o.value === option.value)) {
        newValue = removeOption(option)
      } else {
        newValue = [...selectedValues, option]
      }
    } else {
      newValue = [option]
    }
    setShowMenu(false)
    setSelectedValues(newValue)
    onChange(newValue)
  }

  const isSelected = (option: Option) => {
    return selectedValues.some((o) => o.value === option.value)
  }

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
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

  const renderPlaceholder = () => {
    return (
      <div
        className={`dropdown-selected-value w-full overflow-hidden ${!selectedValues ? "placeholder" : ""}`}>
        {selectedValues.length ? (
          <SelectedComponent
            value={selectedValues[0].value}
            label={selectedValues[0].label}
          />
        ) : (
          placeholder
        )}
      </div>
    )
  }

  return (
    <div className="CustomSelect">
      <div className="custom--dropdown-container">
        <div
          ref={inputRef}
          onClick={handleInputClick}
          className="dropdown-input">
          {renderPlaceholder()}
          <div className="dropdown-tools">
            <div className="dropdown-tool">
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        {showMenu && (
          <div
            ref={dropdownRef}
            className={`dropdown-menu !w-full alignment--${align || "auto"}`}>
            {isSearchable && (
              <div className="search-box">
                <input
                  className="form-control"
                  onChange={onSearch}
                  value={searchValue}
                  ref={searchRef}
                />
              </div>
            )}
            {getOptions()?.length > 0
              ? getOptions().map((option, key) => (
                  <OptionComponent
                    key={key}
                    option={option}
                    options={options}
                    selected={isSelected(option)}
                    onClick={() => onItemClick(option)}
                  />
                ))
              : renderNoOptions()}
          </div>
        )}
      </div>
    </div>
  )
}
