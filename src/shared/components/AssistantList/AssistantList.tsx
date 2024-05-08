import React from 'react';

import './AssistantList.scss';
import { AssistantEntry } from '../AssistantEntry';
import { AssistantInput } from '../AssistantInput';

export interface AssistantListProps {}

export function AssistantList({}: AssistantListProps) {
  return <div className='AssistantList pt-3 flex flex-col h-full'>
    <div className="flex-grow-1">
      <AssistantEntry />
    </div>
    <AssistantInput/>
  </div>;
}
