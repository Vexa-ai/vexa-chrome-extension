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
        <div className="flex flex-col text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] relative group">
          <div className="relative p-3">
            <span className="sticky top-2 z-10 group-hover:block hidden">
              <span className='absolute top-0 right-0'>
                <CopyButton onClick={copyText} />
              </span>
            </span>
            <p className='flex gap-2 mb-1 break-words'>
              <span className="font-semibold text-white select-text">{entryData.role}</span>
            </p>
            <div className="select-text">
              <Markdown>{entryData.text}</Markdown>
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
}
