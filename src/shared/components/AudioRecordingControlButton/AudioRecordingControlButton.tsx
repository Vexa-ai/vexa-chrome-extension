import React, { useEffect } from 'react';

import './AudioRecordingControlButton.scss';
import { VexaPlayButton } from '../VexaPlayButton';
import { VexaPauseButton } from '../VexaPauseButton';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export interface AudioRecordingControlButtonProps {
  className?: string;
}

export function AudioRecordingControlButton({
  className = ''
}: AudioRecordingControlButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  
  return (
    <div className={`${className}`}>
      {isCapturingStore ? <VexaPauseButton /> : <VexaPlayButton />}
    </div>
  );
}
