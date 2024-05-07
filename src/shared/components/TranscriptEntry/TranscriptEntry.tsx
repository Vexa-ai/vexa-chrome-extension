import React from 'react';

import './TranscriptEntry.scss';

export interface TranscriptEntryProps {
  speaker: string;
  text: string;
}

export function TranscriptEntry({ speaker, text }: TranscriptEntryProps) {
  return (
    <div className='TranscriptEntry'>
      <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
        <p className='flex gap-2 mb-1'>
          <span className="font-semibold text-white">{speaker}</span><span>0:04:89</span>
        </p>
        <p>{text}</p>
      </div>
    </div>
  );
}
