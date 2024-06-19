import React, { useEffect, useRef, useState } from 'react';
import './TranscriptList.scss';
import { TranscriptEntry, type TranscriptionEntryData } from '../TranscriptEntry';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { sendMessage } from '~shared/helpers/in-content-messaging.helper';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';
import { TranscriptionCopyButton } from '../TranscriptionCopyButton';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { BouncingDots } from '../BouncingDots';

export interface TranscriptListProps {
  className?: string;
  transcriptList?: TranscriptionEntryData[];
  updatedTranscriptList?: (transcriptList: TranscriptionEntryData[]) => void;
}

export function TranscriptList({ transcriptList = [], updatedTranscriptList = (transcriptList) => { console.log({ transcriptList }) }, className = '' }: TranscriptListProps) {

  const [transcripts, setTranscripts] = useState<TranscriptionEntryData[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [scrolledToTop, setScrolledToTop] = useState(true);
  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const transcriptListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageSender = new MessageSenderService();
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      setIsAutoScroll(scrollTop + clientHeight >= scrollHeight - 10);
      setScrolledToTop(scrollTop === 0);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => { }, 150);
    }
  };

  const getMeetingTranscriptHistory = () => {
    messageSender.sendBackgroundMessage({ type: MessageType.TRANSCRIPTION_HISTORY_REQUEST, data: { meetingId: getIdFromUrl(window.location.href) } })
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollAreaRef]);

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
    if (isAutoScroll && lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    sendMessage(MessageType.HAS_RECORDING_HISTORY, { hasRecordingHistory: true });
    updatedTranscriptList(transcripts);
  }, [transcripts]);

  useEffect(() => {
    setTranscripts(transcriptList);
    getMeetingTranscriptHistory();
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    };
  }, []);

  return (
    <div ref={transcriptListRef} className={`TranscriptList flex flex-col max-h-full w-full overflow-hidden group/transcript-container ${className}`}>
      <div ref={scrollAreaRef} className="flex-grow overflow-y-auto">
        {transcripts.length === 0 && isCapturing && <div className="flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
          <BouncingDots />
        </div>}
        {transcripts.length > 0 && <div className={`mr-2 ${scrolledToTop ? '' : 'hidden'} group-hover/transcript-container:flex mt-2 sticky top-1 z-50 w-[fit-content]`}>
          <TranscriptionCopyButton className='rounded-lg' />
        </div>}
        {transcripts.map((transcript, index) => (
          <div key={index} ref={transcripts.length - 1 === index ? lastEntryRef : null}>
            <TranscriptEntry timestamp={transcript.timestamp} text={transcript.content} speaker={transcript.speaker} />
          </div>
        ))}
      </div>
    </div>
  );
}

