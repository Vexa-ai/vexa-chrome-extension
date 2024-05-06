import React from 'react';

import './TranscriptEntry.scss';

export interface TranscriptEntryProps {}

export function TranscriptEntry({}: TranscriptEntryProps) {
  return (
    <div className='TranscriptEntry'>
      <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
        <p className='flex gap-2 mb-1'>
          <span className="font-semibold text-white">Bob</span><span>0:04:89</span>
        </p>
        <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Doloremque quas nulla dolore cumque dolor? Tempore voluptate vero nisi totam quod et modi deleniti ad, laborum odio, dolore quis ab commodi.</p>
      </div>
    </div>
  );
}
