import React, { useEffect, useRef, useState } from 'react';
import Select, { type SelectItemRenderer, type SelectRenderer } from "react-dropdown-select";
import microphoneOffIcon from "data-base64:~assets/images/svg/microphone-off-02.svg";
import microphoneIcon from "data-base64:~assets/images/svg/microphone-02.svg";
import checkIcon from "data-base64:~assets/images/svg/check.svg";
import './MicrophoneSelector.scss';
import { MicrophoneLevelIndicator } from '../MicrophoneLevelIndicator';

export interface MicrophoneSelectorProps { }

export function MicrophoneSelector({ }: MicrophoneSelectorProps) {
  const [selectedMicrophone, setSelectedMicrophone] = useState([]);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    {
      value: 1,
      label: 'Microphone 1'
    },
    {
      value: 2,
      label: 'Microphone 2'
    }
  ];

  const onMicrophoneSelected = (value) => {
    console.log(value);
    setSelectedMicrophone(value);
  };

  const customContentRenderer = ({ props, state, methods }: SelectRenderer<any>) => {
    // Renders the selected value for the Select
    return false ? (
      <div>Loading...</div>
    ) : (
      <div>
        {/* Selected <b>{state.values.length}</b> out of{" "}
        <b>{props.options.length}</b> */}

        <div className='flex gap-2 text-[#94969C] items-center w-full'>
          {
            state.values.length === 0
              ? (
                <>
                  <img className='w-5' src={microphoneOffIcon} />
                  <p className='min-h-6'>No microphone</p>
                </>

              )
              : (
                <div className='flex w-full gap-1'>
                  <img className='w-5' src={microphoneIcon} />
                  <p className='text-[#F5F5F6] min-h-6 mr-auto w-auto'>{state.values[0].label}</p>
                  <MicrophoneLevelIndicator level={5} />
                </div>

              )
          }
        </div>

      </div>
    );
  };

  const customOptionRenderer = ({ item, props, state, methods }: SelectItemRenderer<any>) => (
    <div onClick={() => methods.addItem(item)} className={`flex gap-2 items-center ${selectedMicrophone?.[0]?.value === item.value ? 'bg-[#1F242F]' : 'bg-slate-950'} py-2 px-2 m-1 hover:bg-[#1F242F] text-[#F5F5F6] rounded-lg`}>
      <p className='mr-auto min-h-6'>{item.label}</p>
      { selectedMicrophone?.[0]?.value === item.value && <img className='w-6' src={checkIcon} /> }
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return <div className="MicrophoneSelector flex flex-col w-full">
    <label htmlFor="micSelect" className='text-white mb-2 flex text-sm font-medium'>Select Microphone</label>
    <div ref={dropdownRef}>
      <Select name='micSelect' style={
        {
          width: '100%',
          borderRadius: '8px',
          borderColor: '#333741',
          fontSize: '0.875rem',
        }
      }
        className='w-full text-white rounded-lg px-[14px] py-[10px] !border-[#333741] !min-h-11'
        options={options}
        onChange={onMicrophoneSelected}
        values={selectedMicrophone}
        contentRenderer={customContentRenderer}
        itemRenderer={customOptionRenderer}
        keepOpen={isOpen}
        onDropdownOpen={() => setIsOpen(true)}
        onDropdownClose={() => setIsOpen(false)}
      // dropdownHandleRenderer={customDropdownRenderer}
      />
    </div>

  </div>

}
