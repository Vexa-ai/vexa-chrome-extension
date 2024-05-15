import React, { useEffect, useRef, useState } from 'react';
import Select, { type SelectItemRenderer, type SelectRenderer } from "react-dropdown-select";
import microphoneOffIcon from "data-base64:~assets/images/svg/microphone-off-02.svg";
import microphoneIcon from "data-base64:~assets/images/svg/microphone-02.svg";
import checkIcon from "data-base64:~assets/images/svg/check.svg";
import './MicrophoneSelector.scss';
import { MicrophoneLevelIndicator } from '../MicrophoneLevelIndicator';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { CustomSelect, type Option } from '../CustomSelect';
// import Select from 'react-select'

export interface MicrophoneSelectorProps { }

export function MicrophoneSelector({ }: MicrophoneSelectorProps) {
  const [selectedMicrophone] = StorageService.useHookStorage<MediaDeviceInfo>(StoreKeys.SELECTED_MICROPHONE);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const audioCapture = useAudioCapture();

  const onMicrophoneSelected = async (value: MediaDeviceInfo[]) => {
    audioCapture.setSelectedAudioInputDevice(value[0]);
  };

  useEffect(() => {
    setMicrophones(audioCapture.state.availableAudioInputs?.map(device => ({ ...device, value: device.label })));
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

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const options: Option[] = microphones.map(microphone => ({ ...microphone, value: microphone.deviceId }));
  const handleChange = (option: Option) => {
    setSelectedOption(option);
  };

  return <div className="MicrophoneSelector flex flex-col w-full">
    <label htmlFor="micSelect" className='text-white mb-2 flex text-sm font-medium'>Select Microphone</label>
    <div ref={dropdownRef}>
      <CustomSelect
        placeholder={<CustomPlaceholder />}
        selectedComponent={CustomSelected}
        options={options}
        isMulti={false}
        keepOpen={isOpen}
        isSearchable={false}
        onChange={handleChange}
        align="left"
        noOptionsComponent={CustomNoOption}
        optionComponent={CustomOption}
      />
    </div>
  </div>

}

const CustomNoOption: React.FC = () => (
  <div className={`flex gap-2 items-center bg-[#0C111D] py-2 px-2 m-1 text-[#F5F5F6] rounded-lg`}>
    <p className='min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full mx-auto'>No microphones found</p>
  </div>
);

const CustomPlaceholder: React.FC = () => (
  <div className='flex gap-2 text-[#94969C] items-center w-full overflow-hidden'>
    <img alt='' className='w-5' src={microphoneOffIcon} />
    <p className='min-h-6'>No microphone</p>
  </div>
);

const CustomSelected: React.FC<{ value: any }> = ({ value }) => (
  <div className='bg-gray-900'>{value}</div>
);

const CustomOption: React.FC<{ option: Option; selected: boolean; onClick: () => void }> = ({ option, selected, onClick }) => (
  <div onClick={onClick} className={`flex gap-2 items-center ${selected ? 'bg-[#1F242F]' : 'bg-slate-950'} py-2 px-2 m-1 hover:bg-[#1F242F] text-[#F5F5F6] rounded-lg`}>
    <p className='mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full' title={option.label}>{option.label}</p>
    {selected && <img alt='' className='w-6' src={checkIcon} />}
  </div>
);
