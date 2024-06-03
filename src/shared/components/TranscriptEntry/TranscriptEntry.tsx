import React from 'react';
import './TranscriptEntry.scss';
import { CopyButton } from '../CopyButton';

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
  if (!timestamp) {
    return '';
  }
  
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}


export function TranscriptEntry({ speaker, text, timestamp }: TranscriptEntryProps) {
  const formattedTimestamp = formatDateString(timestamp);

  const copyTranscript = () => {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className='TranscriptEntry my-2'>
      <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] relative group">
        <span className='absolute right-[16px] top-[16px] group-hover:block hidden ease-in-out'><CopyButton onClick={copyTranscript} /></span>
        <p className='flex gap-2 mb-1 break-words items-center'>
          <span className="font-semibold text-white">{speaker}</span><span className='items-center text-xs'>{formattedTimestamp}</span>
        </p>
        <p className='break-words'>{text}</p>
      </div>
    </div>
  );
}
