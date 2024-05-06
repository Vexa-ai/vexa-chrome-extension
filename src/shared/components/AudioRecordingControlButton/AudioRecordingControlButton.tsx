import React, { useEffect } from 'react';

import './AudioRecordingControlButton.scss';
import { VexaPlayButton } from '../VexaPlayButton';
import { VexaPauseButton } from '../VexaPauseButton';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';

export interface AudioRecordingControlButtonProps {
  className?: string;
}

export function AudioRecordingControlButton({
  className = ''
}: AudioRecordingControlButtonProps) {
  const audioCapture = useAudioCapture();
  
  return (
    <div className={`${className}`}>
      {audioCapture.state.isCapturing ? <VexaPauseButton /> : <VexaPlayButton />}
    </div>
  );
}
