import React from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export interface VexaToolbarProps {}

export function VexaToolbar({}: VexaToolbarProps) {
  const [_, setIsMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE);

  const minimizeVexa = () => {
    setIsMaximized(false);
  }
  
  return <div className='VexaToolbar flex flex-row w-full h-9 mb-3'>
    <VexaLogo onClick={minimizeVexa} />
    <AudioRecordingControlButton className='ml-auto h-auto'/>
  </div>;
}
