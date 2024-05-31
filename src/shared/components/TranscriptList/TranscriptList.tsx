import React, { useEffect, useRef, useState } from 'react';

import './TranscriptList.scss';
import { TranscriptEntry, type TranscriptionEntryData } from '../TranscriptEntry';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';

export interface TranscriptListProps {
  transcriptList?: TranscriptionEntryData[];
  updatedTranscriptList?: (transcriptList: TranscriptionEntryData[]) => void;
}

export function TranscriptList({ transcriptList = [], updatedTranscriptList = (transcriptList) => { console.log({transcriptList}) } }: TranscriptListProps) {

  const [transcripts, setTranscripts] = useState<TranscriptionEntryData[]>([]);
  const transcriptListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
  MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_RESULT, (message) => {
    const transcription: TranscriptionEntryData[] = message.data?.transcripts || [];
    if (transcription && transcription.length) {
      const previousTranscripts = [...transcripts];
      const cursorIndex = previousTranscripts.findLastIndex(prevTranscript => prevTranscript.timestamp === transcription[0].timestamp);
      setTranscripts([...previousTranscripts.splice(0, cursorIndex), ...transcription]);
    }

  });

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    updatedTranscriptList(transcripts);
  }, [transcripts]);

  useEffect(() => {
    setTranscripts(transcriptList);
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    }
  }, []);

  return (
    <div ref={transcriptListRef} className='TranscriptList flex flex-col max-h-full w-full overflow-hidden'>
      <div className="flex-grow overflow-y-auto">
        {transcripts.map((transcript, index) => (
          <div key={index} ref={transcripts.length - 1 === index ? lastEntryRef : null}>
            <TranscriptEntry timestamp={transcript.timestamp} text={transcript.content} speaker={transcript.speaker} />
          </div>
        ))}
      </div>

    </div>
  );
}
