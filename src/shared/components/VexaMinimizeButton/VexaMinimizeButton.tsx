import React from 'react';
import minimizeIcon from "data-base64:~assets/images/svg/minimize-01.svg";
import './VexaMinimizeButton.scss';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export interface VexaMinimizeButtonProps {

}

export function VexaMinimizeButton({ ...rest }: VexaMinimizeButtonProps) {
  const [_, setIsMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE);
  
  const minimizeVexa = () => {
    setIsMaximized(false);
  }

  return (
    <div {...rest} className='VexaMinimizeButton'>
      <button onClick={minimizeVexa} className='bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
        <img alt='' className='w-5 h-5' src={minimizeIcon} />
      </button>
    </div>
  );
}
