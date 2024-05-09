import React, { useContext, useEffect, useState } from 'react';
import './MicrophoneHints.scss';
import closeIcon from "data-base64:~assets/images/svg/x-close.svg";
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { useStorage } from '@plasmohq/storage/hook';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export enum MicrophoneStatus {
  MUTED = 'MUTED',
  SELECTED = 'SELECTED',
  RECORDING = 'RECORDING',
}

export interface MicrophoneHintsProps {
  className?: string,
}

export function MicrophoneHints({ className = '' }: MicrophoneHintsProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [status, setStatus] = useState(MicrophoneStatus.MUTED);
  const [selectedMicrophone] = StorageService.useHookStorage(StoreKeys.SELECTED_MICROPHONE);

  const closeSelf = () => {
    setIsClosed(true);
  }

  MessageListenerService.unRegisterMessageListener(MessageType.ON_MICROPHONE_SELECTED);
  MessageListenerService.registerMessageListener(MessageType.ON_MICROPHONE_SELECTED, (evtData) => {
    setStatus(evtData.data?.device ? MicrophoneStatus.SELECTED : MicrophoneStatus.MUTED)
  });

  useEffect(() => {
    // setStatus(selectedMicrophone ? MicrophoneStatus.SELECTED : MicrophoneStatus.MUTED);
    setIsClosed(false);
  }, [selectedMicrophone]);

  return (
    <div className={`MicrophoneHints ${className}`}>
        {!isClosed &&
          <div className="flex flex-col py-5 px-4 rounded-lg bg-[#161B26]">
            <div className="flex">
              <p className='mr-auto text-sm font-semibold text-[#F5F5F6]'>{status === MicrophoneStatus.MUTED ? 'Your microphone is muted' : 'How to start a recording?'}</p>
              <button type='button' onClick={closeSelf} className="flex items-center justify-center text-gray">
                <img alt='' className='w-4 h-4' src={closeIcon} />
              </button>
            </div>
            <div className="flex text-[#94969C]">
              { selectedMicrophone
                ? <p>Please give microphone permission in the extension settings</p>
                : <div>
                  <p>To start recording do one of the options:</p>
                  <ul className='list-disc pl-6 mt-2'>
                    <li>Click on the extension icon</li>
                    <li>Press Ctrl + Shift + W</li>
                    <li>Right click on the extension icon -&gt; Start recording</li>
                  </ul>
                </div>
              }
            </div>
          </div>
        }
    </div>
  );
}
