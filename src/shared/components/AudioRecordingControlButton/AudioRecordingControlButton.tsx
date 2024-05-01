import React, { useEffect } from 'react';

import './AudioRecordingControlButton.scss';
import { VexaPlayButton } from '../VexaPlayButton';
import { VexaPauseButton } from '../VexaPauseButton';
import { AudioCaptureContext, useAudioCapture } from '~shared/hooks/use-audiocapture';

export interface AudioRecordingControlButtonProps {
  className?: string;
}

export function AudioRecordingControlButton({
  className = ''
}: AudioRecordingControlButtonProps) {
  const audioCapture = useAudioCapture();

  useEffect(() => {
    console.log({audioCapture});
  }, [audioCapture]);
  return (
    <AudioCaptureContext.Provider value={audioCapture}>
      <div className={`${className}`}>
        { audioCapture.state.isCapturing ? <VexaPauseButton onClick={() => audioCapture.stopAudioCapture()} recordedSeconds={audioCapture.captureTime} /> : <VexaPlayButton onClick={() => audioCapture.startAudioCapture()} />}
        
      </div>
    </AudioCaptureContext.Provider>
   
  );
}
