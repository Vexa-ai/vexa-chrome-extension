import React, { useEffect, useState } from 'react';

import './MainContentView.scss';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { TranscriptList } from '../TranscriptList';
import { type AssistantEntryData, AssistantList } from '../AssistantList';
import type { TranscriptionEntryData } from '../TranscriptEntry';
import { MessageType } from '~lib/services/message-listener.service';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export interface MainContentViewProps {
  [key: string]: any;
}

let transcriptList: TranscriptionEntryData[] = [];

export function MainContentView({ className, ...rest }: MainContentViewProps) {
  const [assistantList, setAssistantList] = useState<AssistantEntryData[]>([]);
  const [hasTranscripts, setHasTranscripts] = useState(false);
  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false);

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

  const onTabChanged = (activeTabIndex: number) => {
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex });
  }

  useEffect(() => {
    const transcriptionCleanupFn = onMessage(MessageType.COPY_TRANSCRIPTION, () => {
      copyTranscriptions();
      sendMessage(MessageType.COPY_TRANSCRIPTION_SUCCESS);
    });

    const hasRecordingHistoryCleanup = onMessage<{hasRecordingHistory: boolean}>(MessageType.HAS_RECORDING_HISTORY, data => {
      console.log('Setting hasRecrding state in maincontentview')
      setHasRecordingHistory(data.hasRecordingHistory);
    });
    return () => {
      transcriptionCleanupFn();
      hasRecordingHistoryCleanup();
    }
  }, []);

  return (
    <div {...rest} className={`MainContentView flex flex-grow overflow-hidden h-auto ${className}`}>
      <Tabs onSelect={onTabChanged} className={`text-gray-300 w-full flex flex-col flex-1 ${ !(isCapturing && hasRecordingHistory) ? '' : ''}`}>
        <div className='fixed left-0 w-full px-4 z-50'>
          <TabList className='flex text-gray-300 z-10 w-full bg-slate-950 border-b border-b-gray-700 rounded-b-sm'>
            <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Transcript</Tab>
            {/* <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Notes</Tab> */}
            <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Assistant</Tab>
          </TabList>
        </div>

        <TabPanel className='w-full hidden react-tab-panel'>
          <TranscriptList className={hasTranscripts ? '' : `mt-[50px]`} transcriptList={transcriptList} updatedTranscriptList={(list) => onListUpdated(list)} />
        </TabPanel>

        {/* <TabPanel className={`w-full hidden react-tab-panel`}>
          Notes here
        </TabPanel> */}

        <TabPanel className='w-full hidden react-tab-panel'>
          <AssistantList assistantList={assistantList} updatedAssistantList={(list) => setAssistantList(list)} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
