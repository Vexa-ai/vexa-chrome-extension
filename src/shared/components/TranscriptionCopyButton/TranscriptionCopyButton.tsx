import React, { useEffect, useRef, useState } from 'react';

import './TranscriptionCopyButton.scss';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { MessageType } from '~lib/services/message-listener.service';
import { CopyButton } from '../CopyButton';
import { ClipboardButton } from '../ClipboardButton';

export interface TranscriptionCopyButtonProps {
  className?: string;
}

export function TranscriptionCopyButton({ className = '' }: TranscriptionCopyButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const clipboardBtnRef = useRef(null);

  const copyTranscription = () => {
    clipboardBtnRef?.current?.click();
    setCopied(true);
    sendMessage(MessageType.COPY_TRANSCRIPTION);
    setTimeout(() => {
      setCopied(false);
  }, 1000);
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

  // return (
  //   <>
  //     {((isCapturingStore || hasRecordingHistory) && activeTabIndex === 0) && <div className='TranscriptionCopyButton'>
  //       <CopyButton onClick={copyTranscription} />
  //     </div>}
  //   </>
  // );

  return (
    <>
      {((isCapturingStore || hasRecordingHistory)) && <div onClick={copyTranscription} className={`TranscriptionCopyButton flex gap-2 items-center bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 cursor-pointer ${className}`}>
        <ClipboardButton clipboardRef={clipboardBtnRef} />
        <p>{copied ? 'Copied Transcriptions!' : 'Copy Full Transcript'}</p>
      </div>}
    </>
  );
}
