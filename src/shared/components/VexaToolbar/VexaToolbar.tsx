import React from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';

export interface VexaToolbarProps {
  prop?: string;
}

export function VexaToolbar({}: VexaToolbarProps) {
  return <div className='VexaToolbar flex flex-row w-full h-9'>
    <VexaLogo />
    <AudioRecordingControlButton className='ml-auto h-auto'/>
  </div>;
}
