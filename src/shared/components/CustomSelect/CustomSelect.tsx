import React, { useEffect, useRef, useState } from 'react';
import './CustomSelect.scss';

export interface Option {
  label: string;
  value: any;
}

export interface CustomSelectProps {
  placeholder: React.ReactNode;
  selectedComponent: React.ComponentType<{ value: any }>;
  noOptionsComponent?: React.ComponentType;
  options: Option[];
  isMulti: boolean;
  isSearchable: boolean;
  keepOpen?: boolean;
  onChange: (value: Option | Option[]) => void;
  align: 'left' | 'right';
  optionComponent: React.ComponentType<{ option: Option; selected: boolean; onClick: () => void }>;
}

export function CustomSelect({
  placeholder,
  selectedComponent: SelectedComponent = ({ value }) => <span>{value}</span>,
  options,
  isMulti,
  isSearchable,
  noOptionsComponent: NoOptionsComponent,
  keepOpen = false,
  onChange,
  align,
  optionComponent: OptionComponent = ({ option, selected, onClick }) => <span onClick={onClick} className={selected && 'custom--dropdown-container'}>{option.label}</span>,
}: CustomSelectProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedValues, setSelectedValues] = useState<Option[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue("");
    if (showMenu && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showMenu]);

  useEffect(() => {
    setShowMenu(keepOpen);
  }, [keepOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleInputClick = () => {
    if (keepOpen) {
      setShowMenu(true);
      return;
    }
    setShowMenu(!showMenu);
  };

  const removeOption = (option: Option) => {
    return selectedValues.filter(o => o.value !== option.value);
  };

  const onTagRemove = (e: React.MouseEvent, option: Option) => {
    e.stopPropagation();
    const newValue = removeOption(option);
    setSelectedValues(newValue);
    onChange(newValue);
  };

  const onItemClick = (option: Option) => {
    let newValue;
    if (isMulti) {
      if (selectedValues.some(o => o.value === option.value)) {
        newValue = removeOption(option);
      } else {
        newValue = [...selectedValues, option];
      }
    } else {
      newValue = option;
    }
    setSelectedValues(newValue);
    onChange(newValue);
    console.log(newValue);
  };

  const isSelected = (option: Option) => {
    return selectedValues.some(o => o.value === option.value);
  };

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const getOptions = () => {
    if (!searchValue) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const renderNoOptions = () => {
    return <>
      {<NoOptionsComponent /> || <div>No options</div>}
    </>
  };

  const renderPlaceholder = () => {
    return <div className={`dropdown-selected-value ${!selectedValues ? 'placeholder' : ''}`}>
      {selectedValues.length ? <SelectedComponent value={selectedValues[0].value} /> : placeholder}
    </div>;
  };

  return (
    <div className="CustomSelect">
      <div className="custom--dropdown-container !w-full">
        <div
          ref={inputRef}
          onClick={handleInputClick}
          className="dropdown-input"
        >
          {renderPlaceholder()}
          <div className="dropdown-tools">
            <div className="dropdown-tool">
              <Icon isOpen={showMenu} />
            </div>
          </div>
        </div>
        {showMenu && (
          <div ref={dropdownRef} className={`dropdown-menu !w-full alignment--${align || 'auto'}`}>
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
            {getOptions().length > 0 
              ? (
                  getOptions().map(option => (
                    <OptionComponent
                      key={option.value}
                      option={option}
                      selected={isSelected(option)}
                      onClick={() => onItemClick(option)}
                    />
                  ))
               ) : renderNoOptions()
            }
          </div>
        )}
      </div>
    </div>

  );
}

const Icon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="#222"
    strokeWidth="1.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isOpen ? 'translate' : ''}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
