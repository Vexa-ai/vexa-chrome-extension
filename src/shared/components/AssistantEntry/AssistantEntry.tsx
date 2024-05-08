import React from 'react';

import './AssistantEntry.scss';

export interface AssistantEntryProps { }

export function AssistantEntry({ }: AssistantEntryProps) {
  return <div className='AssistantEntry'>
    <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
      <p className='flex gap-2 mb-1'>
        <span className="font-semibold text-white">Bob</span>
      </p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Fugiat, vero aspernatur earum veniam rerum pariatur quisquam, expedita dignissimos porro, optio perferendis dolores mollitia corporis iusto? Repellendus molestias ab commodi debitis?</p>
    </div>
  </div>;
}
