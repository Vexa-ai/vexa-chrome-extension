import React from 'react';
import './TranscriptEntry.scss';
import { CopyButton } from '../CopyButton';
import { LineWave, RotatingLines } from 'react-loader-spinner';
import { BouncingDots } from '../BouncingDots';
import { EditPenButton } from '../EditPenButton';
import { sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { MessageType } from '~lib/services/message-listener.service';

export interface TranscriptEntryProps {
  speaker: string;
  speaker_id: string;
  text: string;
  timestamp: string;
}

export interface TranscriptionEntryData {
  content: string;
  keywords: string[];
  speaker: string;
  speaker_id: string;
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


export function TranscriptEntry({ speaker, text, speaker_id, timestamp }: TranscriptEntryProps) {
  const formattedTimestamp = formatDateString(timestamp);

  const editSpeaker = () => {
    sendMessage(MessageType.SPEAKER_EDIT_START, { speaker, speaker_id })
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className='TranscriptEntry my-2'>
      <div className="flex flex-col p-3 text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] relative group">
        <span className="sticky top-2 z-10 group-hover:block hidden">
          <span className='absolute top-0 right-0'>
            <CopyButton onClick={copyTranscript} />
          </span>
        </span>
        <div className='flex gap-2 mb-1 break-words items-center'>
          <span className='flex gap-2 group/speaker-name'>
            <span className={`font-semibold text-[#94969C] select-text break-words ${speaker !== 'TBD' && 'cursor-pointer'}`}>{speaker === 'TBD'
              ? <BouncingDots />
              : speaker}
            </span>
            {speaker !== 'TBD' && <EditPenButton onClick={editSpeaker} className='hidden group-hover/speaker-name:inline-block stroke-[#94969C]' />}
          </span>
          <span className='items-center text-[#94969C] text-xs select-text break-words ml-auto'>{formattedTimestamp}</span>
        </div>
        <p className='break-words select-text'>{text}</p>
      </div>
    </div>
  );
}