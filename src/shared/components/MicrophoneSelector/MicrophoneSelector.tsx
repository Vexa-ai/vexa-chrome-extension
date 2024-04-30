import React, { useState } from 'react';
import Select, { type SelectItemRenderer, type SelectRenderer } from "react-dropdown-select";
import microphoneOffIcon from "data-base64:~assets/images/svg/microphone-off-02.svg";
import microphoneIcon from "data-base64:~assets/images/svg/microphone-02.svg";
import './MicrophoneSelector.scss';

export interface MicrophoneSelectorProps { }

export function MicrophoneSelector({ }: MicrophoneSelectorProps) {
  const [selectedMicrophone, setSelectedMicrophone] = useState([]);
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
        
          <div className='flex gap-2 text-[#94969C] items-center'>
          {
            state.values.length === 0 
            ? (
                <>
                  <img className='w-5' src={microphoneOffIcon} />
                  <p>No microphone</p>
                </>
                
              )
            : (
              <>
                <img className='w-5' src={microphoneIcon} />
                <p className='text-[#F5F5F6]'>{state.values[0].label}</p>
              </>
              
            )
          }
          </div>
        
      </div>
    );
  };

  const customOptionRenderer = ({ item, props, state, methods }: SelectItemRenderer<any>) => (
    // <div>
      <div onClick={() => methods.addItem(item)} className='flex gap-2 items-center bg-slate-950 py-2 px-2 hover:bg-slate-200 text-[#F5F5F6] hover:!text-gray-900'>
        <img className='w-5' src={microphoneIcon} />
        <p className=''>{item.label}</p>
      </div>
  );

  return <div className="flex flex-col w-full">
    <label htmlFor="micSelect" className='text-white mb-2 flex text-sm font-medium'>Select Microphone</label>
    <Select name='micSelect' style={
      {
        width: '100%',
        borderRadius: '8px',
        borderColor: '#333741',
        fontSize: '0.875rem',
      }
    }
      className='w-full text-white rounded-lg px-[14px] py-[10px] !border-[#333741]'
      options={options}
      onChange={onMicrophoneSelected}
      values={selectedMicrophone}
      contentRenderer={customContentRenderer}
      itemRenderer={customOptionRenderer}
    />
  </div>

}
