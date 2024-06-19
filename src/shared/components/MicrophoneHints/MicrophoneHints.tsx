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
    setIsClosed(false);
  }, [selectedMicrophone]);

  return (
    <div className={`MicrophoneHints ${className}`}>
        {!selectedMicrophone &&
          <div className="flex flex-col py-5 px-4 rounded-lg bg-[#161B26]">
            <div className="flex text-[#94969C]">
              { !selectedMicrophone
                && 
                <p>Please enable microphone permissions to choose a microphone</p>
              }
            </div>
          </div>
        }
    </div>
  );
}
