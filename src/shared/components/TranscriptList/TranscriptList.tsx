import React, { useEffect, useRef, useState } from 'react';

import './TranscriptList.scss';
import { TranscriptEntry } from '../TranscriptEntry';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';

export interface TranscriptListProps { }

export function TranscriptList({ }: TranscriptListProps) {

  const [transcripts, setTranscripts] = useState<{ speaker: string; content: string }[]>([]);
  const transcriptListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
  MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_RESULT, (message) => {
    const transcription: { speaker: string; content: string }[] = message.data;
    setTranscripts([...transcripts, ...transcription]);
  });

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  useEffect(() => {
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    }
  }, []);

  return (
    <div ref={transcriptListRef} className='TranscriptList flex flex-col max-h-full w-full overflow-hidden'>
      <div className="flex-grow overflow-y-auto">
        {transcripts.map((transcript, index) => (
          <div key={index} ref={transcripts.length - 1 === index ? lastEntryRef : null}>
            <TranscriptEntry text={transcript.content} speaker={transcript.speaker} />
          </div>
        ))}
      </div>

    </div>
  );
}
