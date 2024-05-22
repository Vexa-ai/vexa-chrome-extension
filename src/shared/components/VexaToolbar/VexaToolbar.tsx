import React from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';
import { VexaMinimizeButton } from '../VexaMinimizeButton';

export interface VexaToolbarProps {}

export function VexaToolbar({}: VexaToolbarProps) {
  
  
  return <div className='VexaToolbar flex flex-row w-full h-9 mb-3'>
    <VexaLogo />
    <div className='ml-auto gap-2 flex'>
      <VexaMinimizeButton />
      <AudioRecordingControlButton className='h-auto'/>
    </div>
    
  </div>;
}
