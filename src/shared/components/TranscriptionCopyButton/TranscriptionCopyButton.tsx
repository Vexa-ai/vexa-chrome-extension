import React, { useEffect, useState } from 'react';

import './TranscriptionCopyButton.scss';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { MessageType } from '~lib/services/message-listener.service';
import { CopyButton } from '../CopyButton';

export interface TranscriptionCopyButtonProps {}

export function TranscriptionCopyButton({ }: TranscriptionCopyButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false);

  const copyTranscription = () => {
    sendMessage(MessageType.COPY_TRANSCRIPTION);
  };

  useEffect(() => {
    const tabChangeCleanup = onMessage<{activeTabIndex: number}>(MessageType.TAB_CHANGED, data => {
      setActiveTabIndex(data.activeTabIndex);
    });
    const hasRecordingHistoryCleanup = onMessage<{hasRecordingHistory: boolean}>(MessageType.HAS_RECORDING_HISTORY, data => {
      setHasRecordingHistory(data.hasRecordingHistory);
    });
  
    return () => {
      tabChangeCleanup();
      hasRecordingHistoryCleanup();
    }
  }, []);

  return (
    <>
      {((isCapturingStore || hasRecordingHistory) && activeTabIndex === 0) && <div className='TranscriptionCopyButton'>
        <CopyButton onClick={copyTranscription} />
      </div>}
    </>

  );
}
