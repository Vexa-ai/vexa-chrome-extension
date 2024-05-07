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

  useEffect(() => {
    console.log(audioCapture.state.isCapturing, audioCapture.isCapturing);
  }, [audioCapture.state, audioCapture.isCapturing]);
  
  
  return (
    <div className={`${className}`}>
      {audioCapture.isCapturing ? <VexaPauseButton /> : <VexaPlayButton />}
    </div>
  );
}
