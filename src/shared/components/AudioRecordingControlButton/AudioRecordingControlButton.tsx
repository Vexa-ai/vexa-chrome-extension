import React from 'react';

import './AudioRecordingControlButton.scss';
import { VexaPlayButton } from '../VexaPlayButton';

export interface AudioRecordingControlButtonProps {
  className?: string;
}

export function AudioRecordingControlButton({
  className = ''
}: AudioRecordingControlButtonProps) {
  return (
    <div className={`${className}`}>
      <VexaPlayButton />
    </div>
  );
}
