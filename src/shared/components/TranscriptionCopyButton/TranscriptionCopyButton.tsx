import React from 'react';

import './TranscriptionCopyButton.scss';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { MessageType } from '~lib/services/message-listener.service';
import { CopyButton } from '../CopyButton';

export interface TranscriptionCopyButtonProps {}

export function TranscriptionCopyButton({ }: TranscriptionCopyButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);

  const copyTranscription = () => {
    sendMessage(MessageType.COPY_TRANSCRIPTION);
  };

  return (
    <>
      {isCapturingStore && <div className='TranscriptionCopyButton'>
        <CopyButton onClick={copyTranscription} />
      </div>}
    </>

  );
}
