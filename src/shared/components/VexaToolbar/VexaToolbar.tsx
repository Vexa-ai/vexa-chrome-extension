import React, { type MutableRefObject } from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';
import { VexaMinimizeButton } from '../VexaMinimizeButton';

export interface VexaToolbarProps {
  ref?: MutableRefObject<any>;
  [key: string]: any;
}

export function VexaToolbar({ ref, ...rest }: VexaToolbarProps) {
  
  return <div ref={ref} {...rest} className='VexaToolbar flex flex-row w-full h-9 mb-3 cursor-move'>
    <VexaLogo />
    <div className='ml-auto gap-2 flex'>
      <VexaMinimizeButton />
      <AudioRecordingControlButton className='h-auto'/>
    </div>
    
  </div>;
}
