import React from 'react';

import './MicrophoneOptions.scss';
import { MicrophoneSelector } from '../MicrophoneSelector';
import { MicrophoneHints, MicrophoneStatus } from '../MicrophoneHints';

export interface MicrophoneOptionsProps {
  className?: string;
}

export function MicrophoneOptions({ className = '' }: MicrophoneOptionsProps) {

  return (
    <div className={`MicrophoneOptions flex flex-col w-full ${className}`}>
      <MicrophoneSelector />
      {/* <MicrophoneHints className='mt-2' /> */}
    </div>
  );
}
