import React from 'react';

import './AssistantEntry.scss';
import type { AssistantMessageUnit } from '../AssistantList';
import { CopyButton } from '../CopyButton';
import Markdown from 'markdown-to-jsx';

export interface AssistantEntryProps {
  entryData: AssistantMessageUnit;
}

export function AssistantEntry({ entryData }: AssistantEntryProps) {

  const copyText = () => {
    navigator.clipboard.writeText(entryData.text);
  };


  return (
    <div className='AssistantEntry my-3'>
      {entryData ? (
        <div className="flex flex-col text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] group">
          <div className="relative p-3">
            <p className='flex gap-2 mb-1 break-words'>
              <span className="font-semibold text-white">{entryData.role}</span>
            </p>
            <Markdown>{entryData.text}</Markdown>
            <span className='absolute right-[16px] top-[16px] group-hover:block hidden ease-in-out'><CopyButton onClick={copyText} /></span>
          </div>

        </div>
      ) : null}
    </div>
  );
}
