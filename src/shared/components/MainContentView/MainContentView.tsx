import React from 'react';

import './MainContentView.scss';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { TranscriptList } from '../TranscriptList';
import { AssistantList } from '../AssistantList';

export interface MainContentViewProps {
  prop?: string;
}

export function MainContentView({}: MainContentViewProps) {
  return (
    <div className='MainContentView flex flex-grow overflow-y-auto h-auto'>
      <Tabs className='text-gray-300 w-full flex flex-col flex-1'>
        <TabList className='flex text-gray-300 top-0 sticky w-full bg-slate-950 border-b border-b-gray-700 rounded-b-sm'>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Transcript</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Notes</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Assistant</Tab>
        </TabList>

        <TabPanel>
          <TranscriptList />
        </TabPanel>

        <TabPanel >
          Notes here
        </TabPanel>

        <TabPanel className='h-[-webkit-fill-available]'>
          <AssistantList />
        </TabPanel>
      </Tabs>
    </div>
  );
}
