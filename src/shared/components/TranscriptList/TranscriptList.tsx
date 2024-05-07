import React, { useEffect, useState } from 'react';

import './TranscriptList.scss';
import { TranscriptEntry } from '../TranscriptEntry';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';

export interface TranscriptListProps {}

export function TranscriptList({}: TranscriptListProps) {

  const [transcripts, setTranscripts] = useState<{speaker: string; text: string}[]>([]);

  useEffect(() => {
    MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_RESULT, (message) => {
      const transcription: {speaker: string; text: string}[] = message.data;
      setTranscripts([...transcripts, ...transcription]);
    });
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    }
  }, [])
  
  return (
    <div className='TranscriptList pt-3'>
      {transcripts.map((transcript, key) => <TranscriptEntry key={key} text={transcript.text} speaker={transcript.speaker} />)}
    </div>
  );
}
