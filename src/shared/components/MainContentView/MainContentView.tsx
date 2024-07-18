import React, {useEffect, useState} from 'react';

import './MainContentView.scss';
import {type ActionButton, TranscriptList} from '../TranscriptList';
import {AssistantList} from '../AssistantList';
import type { TranscriptionEntryData } from '../TranscriptEntry';
import { MessageType } from '~lib/services/message-listener.service';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

// TODO: place in correct place (it is placed here to keep static fields on)
import AsyncMessengerService from "~lib/services/async-messenger.service";
const asyncMessengerService = new AsyncMessengerService();

export interface MainContentViewProps {
  [key: string]: any;
}

let transcriptList: TranscriptionEntryData[] = [];
let activeTabIndex = 0;

export function MainContentView({ className, ...rest }: MainContentViewProps) {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [hasTranscripts, setHasTranscripts] = useState(false);
  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false);

  const [actionButtonClicked, setActionButtonClicked] = useState<ActionButton>(null);

  const copyTranscriptions = () => {
    const mergedTranscripts = transcriptList.map(transcript => {
      return `${transcript.speaker}: ${transcript.content}`;
    }).join('\n');
    navigator.clipboard.writeText(mergedTranscripts);
  }

  const onListUpdated = (list: TranscriptionEntryData[]) => {
    transcriptList = list;
    setHasTranscripts(!!transcriptList.length);
  }

  const onTabChanged = (currentTabIndex: number) => {
    activeTabIndex = currentTabIndex;
    setSelectedTabIndex(currentTabIndex);
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex: currentTabIndex });
  }

  useEffect(() => {
    sendMessage(MessageType.HAS_RECORDING_HISTORY, { hasRecordingHistory });
  }, [hasRecordingHistory]);

  useEffect(() => {
    const transcriptionCleanupFn = onMessage(MessageType.COPY_TRANSCRIPTION, () => {
      copyTranscriptions();
      sendMessage(MessageType.COPY_TRANSCRIPTION_SUCCESS);
    });

    setSelectedTabIndex(activeTabIndex);
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex: activeTabIndex });
    sendMessage(MessageType.HAS_RECORDING_HISTORY, { hasRecordingHistory: !!transcriptList.length });

    const hasRecordingHistoryCleanup = onMessage<{ hasRecordingHistory: boolean }>(MessageType.HAS_RECORDING_HISTORY, data => {
      setHasRecordingHistory(data.hasRecordingHistory);
    });
    return () => {
      transcriptionCleanupFn();
      hasRecordingHistoryCleanup();
    }
  }, []);

  function onActionButtonClicked(button: ActionButton) {
    setActionButtonClicked(button);

    setSelectedTabIndex(1);
  }

  return (
    <div {...rest} className={`MainContentView flex flex-col flex-grow overflow-hidden h-auto ${className}`}>
      <ul className="flex text-gray-300 z-10 w-full bg-slate-950 border-b border-b-gray-700 rounded-b-sm" role="tablist">
        <li onClick={() => onTabChanged(0)} className={`focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer${selectedTabIndex === 0 ? ' react-tabs__tab--selected' : ''}`} role="tab" id="tab:r0:0" aria-selected="true" aria-disabled="false"
          aria-controls="panel:r0:0" data-rttab="true" tabIndex={0}>
          Transcript
        </li>

        <li onClick={() => onTabChanged(1)} className={`focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer${selectedTabIndex === 1 ? ' react-tabs__tab--selected' : ''}`} role="tab" id="tab:r0:1" aria-selected="false" aria-disabled="false" aria-controls="panel:r0:1"
          data-rttab="true" tabIndex={1}>
          Assistant
        </li>
      </ul>
      <TranscriptList
        className={selectedTabIndex === 0 ? '' : `mt-[10px] hidden`}
        transcriptList={transcriptList}
        updatedTranscriptList={(list) => onListUpdated(list)}
        onActionButtonClicked={onActionButtonClicked}
      />
      <div className={`${selectedTabIndex === 1 ? 'flex h-full' : 'hidden'}`}>
        <AssistantList actionButtonClicked={actionButtonClicked} />
      </div>
    </div>
  );
}
