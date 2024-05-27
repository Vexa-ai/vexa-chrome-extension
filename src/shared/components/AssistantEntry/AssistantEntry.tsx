import React from 'react';

import './AssistantEntry.scss';
import type { AssistantMessageUnit } from '../AssistantList';

export interface AssistantEntryProps {
  entryData: AssistantMessageUnit;
}

export function AssistantEntry({ entryData }: AssistantEntryProps) {
  return (
    <div className='AssistantEntry my-2'>
      {entryData ? (
        <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
          <p className='flex gap-2 mb-1'>
            <span className="font-semibold text-white">{entryData.role}</span>
          </p>
          <p>{entryData.text}</p>
        </div>
      ) : null}
    </div>
  );
}
