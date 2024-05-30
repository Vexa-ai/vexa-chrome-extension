import React from 'react';
import './TranscriptEntry.scss';

export interface TranscriptEntryProps {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface TranscriptionEntryData {
  content: string;
  keywords: string[];
  speaker: string;
  timestamp: string;
}

// Function to format the timestamp
function formatDateString(timestamp: string): string {
  if(!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  return `${hours}:${formattedMinutes}:${formattedSeconds}`;
}

export function TranscriptEntry({ speaker, text, timestamp }: TranscriptEntryProps) {
  const formattedTimestamp = formatDateString(timestamp);

  return (
    <div className='TranscriptEntry my-2'>
      <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
        <p className='flex gap-2 mb-1 break-words'>
          <span className="font-semibold text-white">{speaker}</span><span>{formattedTimestamp}</span>
        </p>
        <p>{text}</p>
      </div>
    </div>
  );
}
