import React, {useEffect, useRef, useState} from 'react';
import './TranscriptList.scss';
import {TranscriptEntry, TranscriptionEntry, type TranscriptionEntryData, TranscriptionEntryMode} from '../TranscriptEntry';
import {MessageListenerService, MessageType} from '~lib/services/message-listener.service';
import {sendMessage} from '~shared/helpers/in-content-messaging.helper';
import {MessageSenderService} from '~lib/services/message-sender.service';
import {getIdFromUrl} from '~shared/helpers/meeting.helper';
import {AssistantSuggestions, TranscriptionCopyButton} from '~shared/components';
import {type AuthorizationData, StorageService, StoreKeys} from '~lib/services/storage.service';
import {BouncingDots} from '../BouncingDots';
import AsyncMessengerService from "~lib/services/async-messenger.service";

const MEETING_ID = getIdFromUrl(window.location.href);
const asyncMessengerService = new AsyncMessengerService();


export interface ActionButtonsResponse {
  total: number
  buttons?: ActionButton[]
}

export interface ActionButton {
  name: string;
  type: string;
  prompt: string;
}


export interface TranscriptListProps {
  className?: string;
  transcriptList?: TranscriptionEntryData[];
  updatedTranscriptList?: (transcriptList: TranscriptionEntryData[]) => void;
  onActionButtonClicked?: (ab: ActionButton) => void;
}

export function TranscriptList({
    transcriptList = [],
    updatedTranscriptList = (transcriptList) => {
      console.log({transcriptList})
    },
    className = '',
    onActionButtonClicked = (ab: ActionButton) => {}
}: TranscriptListProps) {

  const [transcripts, setTranscripts] = useState<TranscriptionEntryData[] | TranscriptionEntry[]>([]);
  // const [transcriptMode, setTranscriptMode] = useState<TranscriptionEntryMode>(TranscriptionEntryMode.HtmlContentShort);
  const [lastTranscriptTimestamp, setLastTranscriptTimestamp] = useState<Date | null>();
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [scrolledToTop, setScrolledToTop] = useState(true);
  const [actionButtons, setActionButtons] = useState<(ActionButton)[]>();
  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [transcriptMode] = StorageService.useHookStorage<TranscriptionEntryMode>(StoreKeys.TRANSCRIPT_MODE, TranscriptionEntryMode.HtmlContentShort);

  const transcriptListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptsRef = useRef<TranscriptionEntryData[]>();

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts])

  /*
  useEffect(() => {
    console.log({transcriptMode});
    StorageService.set(StoreKeys.TRANSCRIPT_MODE, transcriptMode);
  }, [transcriptMode])
  */

  const lastTranscriptTimestampRef = useRef<Date | null>(null);
  useEffect(() => {
    lastTranscriptTimestampRef.current = lastTranscriptTimestamp;
  }, [lastTranscriptTimestamp])

  const messageSender = new MessageSenderService();
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const {scrollTop, scrollHeight, clientHeight} = scrollAreaRef.current;
      setIsAutoScroll(scrollTop + clientHeight >= scrollHeight - 10);
      setScrolledToTop(scrollTop === 0);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
      }, 150);
    }
  };

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

  /*
  MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
  MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_RESULT, (message) => {
    const transcription: TranscriptionEntryData[] = message.data?.transcripts || [];
    if (transcription && transcription.length) {
      const previousTranscripts = [...transcripts];
      const cursorIndex = previousTranscripts.findLastIndex(prevTranscript => prevTranscript.timestamp === transcription[0].timestamp);
      setTranscripts([...previousTranscripts.splice(0, cursorIndex), ...transcription]);
    }
  });
  */

  const copyTranscription = async () => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA);
    const transcriptionURL = `/transcription?meeting_id=${MEETING_ID}&token=${authData.__vexa_token}${lastTranscriptTimestampRef.current ? '&last_msg_timestamp=' + lastTranscriptTimestampRef.current.toISOString() : ''}`;
    return asyncMessengerService.getRequest(transcriptionURL).then(async (response: TranscriptionEntryData[]) => {
      const mergedTranscripts = response.map(transcript => {
        return `${transcript.speaker}: ${transcript.content}`;
      }).join('\n');

      navigator.clipboard.writeText(mergedTranscripts);
    });
  }

  useEffect(() => {
    const MEETING_ID = getIdFromUrl(window.location.href);
    let counter = 0;
    let interval = setInterval(async () => {
      if (counter++ % 50) {
        // reload whole history every X cycles
        lastTranscriptTimestampRef.current = null;
      }

      const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA);
      const transcriptionURL = `/transcription?meeting_id=${MEETING_ID}&token=${authData.__vexa_token}${lastTranscriptTimestampRef.current ? '&last_msg_timestamp=' + lastTranscriptTimestampRef.current.toISOString() : ''}`;
      asyncMessengerService.getRequest(transcriptionURL).then(async (response: TranscriptionEntryData[]) => {
        response = response.map(entry => new TranscriptionEntry(entry))

        console.log({response});

        if (response && response.length) {
          const dateBackBy5Minute = new Date(response[response.length - 1].timestamp);
          dateBackBy5Minute.setMinutes(dateBackBy5Minute.getMinutes() - 5);
          setLastTranscriptTimestamp(dateBackBy5Minute);

          const previousTranscripts = [...transcriptsRef.current];
          const cursorIndex = previousTranscripts.findLastIndex(prevTranscript => prevTranscript.timestamp === response[0].timestamp);

          console.log({cursorIndex});
          setTranscripts([...previousTranscripts.splice(0, cursorIndex), ...response]);
        }
      });
    }, 3000)

    return () => {
      clearInterval(interval);
    }
  }, [])


  const fetchActionButtons = function () {
    asyncMessengerService.getRequest(`/assistant/buttons?meeting_id=${MEETING_ID}`)
      .then((response: ActionButtonsResponse) => {
        setActionButtons(response.buttons);
      });
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActionButtons();
    }, 10000);

    fetchActionButtons();

    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    if (isAutoScroll && lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({behavior: 'smooth'});
    }
    sendMessage(MessageType.HAS_RECORDING_HISTORY, {hasRecordingHistory: true});
    updatedTranscriptList(transcripts);
  }, [transcripts]);

  useEffect(() => {
    setTranscripts(transcriptList);

    MessageListenerService.unRegisterMessageListener(MessageType.UPDATE_SPEAKER_NAME_RESULT);
    MessageListenerService.registerMessageListener(MessageType.UPDATE_SPEAKER_NAME_RESULT, (message) => {
      sendMessage(MessageType.SPEAKER_EDIT_COMPLETE, message);
    });
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.UPDATE_SPEAKER_NAME_RESULT);
      MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
    };
  }, []);

  return (
    <div ref={transcriptListRef} className={`TranscriptList flex flex-col max-h-full w-full h-full overflow-hidden group/transcript-container ${className}`}>
      {[
        {name: 'short', mode: TranscriptionEntryMode.HtmlContentShort},
        {name: 'original', mode: TranscriptionEntryMode.HtmlContent},
        // {name: 'Original', mode: TranscriptionEntryMode.Content},
      ].map(({name, mode}) => (
        (mode !== transcriptMode && <a
          key={name}
          href="#"
          onClickCapture={(e) => {
            e.preventDefault();
            StorageService.set(StoreKeys.TRANSCRIPT_MODE, mode);
          }}
          className={`TranscriptEntry ${mode === transcriptMode ? 'EntityModeActive' : ''}`}>Show {name}</a>)
      ))}

      <div ref={scrollAreaRef} className="flex-grow overflow-y-auto">
        {transcripts.length > 0 && <div className={`mr-2 ${scrolledToTop ? '' : 'hidden'} group-hover/transcript-container:flex mt-2 sticky top-1 z-50 w-[fit-content]`}>
          <TranscriptionCopyButton className='rounded-lg' onCopyTranscriptClicked={copyTranscription}/>
        </div>}

        {transcripts.map((transcript: TranscriptionEntry, index: number) => (
          <div key={index} ref={transcripts.length - 1 === index ? lastEntryRef : null}>
            <TranscriptEntry entry={transcript} globalMode={transcriptMode} speaker_id={transcript.speaker_id} timestamp={transcript.timestamp} text={transcript.content} speaker={transcript.speaker}/>
          </div>
        ))}

        {isCapturing && <div className="flex flex-grow-0 p-3 mt-1 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
          <BouncingDots/>
        </div>}

      </div>
      <AssistantSuggestions suggestions={actionButtons} selectSuggestion={onActionButtonClicked}/>
    </div>
  );
}

