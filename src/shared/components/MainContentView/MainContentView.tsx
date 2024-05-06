import React from 'react';

import './MainContentView.scss';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { TranscriptList } from '../TranscriptList';

export interface MainContentViewProps {
  prop?: string;
}

export function MainContentView({}: MainContentViewProps) {
  return (
    <div className='MainContentView'>
      <Tabs className='text-gray-300'>
        <TabList className='flex text-gray-300'>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Transcript</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Notes</Tab>
          <Tab className='focus-visible:outline-none flex-1 text-center py-2 rounded-none hover:bg-slate-800 cursor-pointer'>Assistant</Tab>
        </TabList>

        <TabPanel>
          <TranscriptList />
        </TabPanel>

        <TabPanel>
          Notes here
        </TabPanel>

        <TabPanel>
          Assistant here
        </TabPanel>
      </Tabs>
    </div>
  );
}
