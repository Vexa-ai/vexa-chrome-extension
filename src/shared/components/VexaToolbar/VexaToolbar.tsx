import React from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';

export interface VexaToolbarProps {}

export function VexaToolbar({}: VexaToolbarProps) {
  return <div className='VexaToolbar flex flex-row w-full h-9 mb-3'>
    <VexaLogo />
    <AudioRecordingControlButton className='ml-auto h-auto'/>
  </div>;
}
