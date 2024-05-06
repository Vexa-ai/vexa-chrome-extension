import React, { useEffect, useRef, useState } from 'react';
import Select, { type SelectItemRenderer, type SelectRenderer } from "react-dropdown-select";
import microphoneOffIcon from "data-base64:~assets/images/svg/microphone-off-02.svg";
import microphoneIcon from "data-base64:~assets/images/svg/microphone-02.svg";
import checkIcon from "data-base64:~assets/images/svg/check.svg";
import './MicrophoneSelector.scss';
import { MicrophoneLevelIndicator } from '../MicrophoneLevelIndicator';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { useStorage } from '@plasmohq/storage/hook';
export interface MicrophoneSelectorProps { }

export function MicrophoneSelector({ }: MicrophoneSelectorProps) {
  const [selectedMicrophone, setSelectedMicrophone] = useStorage<MediaDeviceInfo>('selectedMicrophone');
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const audioCapture = useAudioCapture();

  const onMicrophoneSelected = (value: MediaDeviceInfo[]) => {
    setSelectedMicrophone(value[0]);
    audioCapture.setSelectedAudioInputDevice(value[0]);
  };

  useEffect(() => {
    setMicrophones(audioCapture.state.availableAudioInputs?.map(device => ({...device, value: device.label})));
  }, [audioCapture.availableAudioInputs]);

  const customContentRenderer = ({ props, state, methods }: SelectRenderer<any>) => {
    return false ? (
      <div>Loading...</div>
    ) : (
      <div>
        <div className='flex gap-2 text-[#94969C] items-center w-full overflow-hidden'>
          {
            state.values.length === 0
              ? (
                <>
                  <img alt='' className='w-5' src={microphoneOffIcon} />
                  <p className='min-h-6'>No microphone</p>
                </>

              )
              : (
                <div className='flex w-full gap-1 overflow-hidden'>
                  <img alt='' className='w-5' src={microphoneIcon} />
                  <p className='text-[#F5F5F6] min-h-6 mr-auto w-auto whitespace-nowrap text-ellipsis overflow-hidden' title={state.values[0].label}>{state.values[0].label}</p>
                  <MicrophoneLevelIndicator />
                </div>

              )
          }
        </div>

      </div>
    );
  };

  const customOptionRenderer = ({ item, props, state, methods }: SelectItemRenderer<any>) => (
    <div onClick={() => methods.addItem(item)} className={`flex gap-2 items-center ${selectedMicrophone?.deviceId === item.deviceId ? 'bg-[#1F242F]' : 'bg-slate-950'} py-2 px-2 m-1 hover:bg-[#1F242F] text-[#F5F5F6] rounded-lg`}>
      <p className='mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full' title={item.label}>{item.label}</p>
      {selectedMicrophone?.deviceId === item.deviceId && <img alt='' className='w-6' src={checkIcon} />}
    </div>
  );

  const onDropdownOpenHandler = () => {
    setIsOpen(true);
    audioCapture.requestMicrophones();
  }

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
        options={microphones}
        onChange={onMicrophoneSelected}
        values={selectedMicrophone ? [selectedMicrophone] : []}
        contentRenderer={customContentRenderer}
        itemRenderer={customOptionRenderer}
        keepOpen={isOpen}
        onDropdownOpen={onDropdownOpenHandler}
        onDropdownClose={() => setIsOpen(false)}
      />
    </div>

  </div>

}
