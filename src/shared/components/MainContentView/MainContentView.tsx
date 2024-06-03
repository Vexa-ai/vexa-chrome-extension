import React, { useEffect, useState } from 'react';

import './MainContentView.scss';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { TranscriptList } from '../TranscriptList';
import { type AssistantEntryData, AssistantList } from '../AssistantList';
import type { TranscriptionEntryData } from '../TranscriptEntry';
import { MessageType } from '~lib/services/message-listener.service';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';

export interface MainContentViewProps {
  [key: string]: any;
}

let transcriptList = [];

export function MainContentView({ ...rest }: MainContentViewProps) {
  const [assistantList, setAssistantList] = useState<AssistantEntryData[]>([]);

  const copyTranscriptions = () => {
    const mergedTranscripts = transcriptList.map(transcript => transcript.content).join('\n');
    console.log({transcriptList, mergedTranscripts});;
    navigator.clipboard.writeText(mergedTranscripts);
  }

  const onListUpdated = (list: TranscriptionEntryData[]) => {
    transcriptList = list;
  }

  const onTabChanged = (activeTabIndex: number) => {
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex });
  }

  useEffect(() => {
    const transcriptionCleanupFn = onMessage(MessageType.COPY_TRANSCRIPTION, () => {
      copyTranscriptions();
      sendMessage(MessageType.COPY_TRANSCRIPTION_SUCCESS);
    });

    return transcriptionCleanupFn;
  }, []);

  return (
    <div {...rest} className='MainContentView flex flex-grow overflow-hidden h-auto'>
      <Tabs onSelect={onTabChanged} className='text-gray-300 w-full flex flex-col flex-1'>
        <TabList className='flex text-gray-300 top-0 z-10 sticky w-full bg-slate-950 border-b border-b-gray-700 rounded-b-sm'>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Transcript</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Notes</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Assistant</Tab>
        </TabList>

        <TabPanel className='w-full hidden react-tab-panel'>
          <TranscriptList transcriptList={transcriptList} updatedTranscriptList={(list) => onListUpdated(list)} />
        </TabPanel>

        <TabPanel className='w-full hidden react-tab-panel'>
          Notes here
        </TabPanel>

        <TabPanel className='w-full hidden react-tab-panel'>
          <AssistantList assistantList={assistantList} updatedAssistantList={(list) => setAssistantList(list)} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
