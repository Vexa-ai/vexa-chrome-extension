import React, { useEffect, useRef, useState } from 'react';

import './AssistantList.scss';
import { AssistantEntry } from '../AssistantEntry';
import { AssistantInput } from '../AssistantInput';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';

export interface AssistantEntryData {
  current_chain: number;
  user_message?: AssistantMessageUnit;
  assistant_message?: AssistantMessageUnit;
};

export interface AssistantMessageUnit {
  user_id: string;
  meeting_id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface AssistantListProps {
  className?: string;
  assistantList?: AssistantEntryData[];
  updatedAssistantList?: (assistantList: AssistantEntryData[]) => void;
}

export function AssistantList({ assistantList = [], className = '', updatedAssistantList = (assistantList) => { console.log({assistantList}) } }: AssistantListProps) {

  const [responses, setResponses] = useState<AssistantEntryData[]>([]);
  const [clearField, setClearField] = useState<boolean>(false);
  const assistantListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const messageSender = new MessageSenderService();

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_RESULT, (message) => {
    const response: AssistantEntryData = message.data;
    const newResponses = [...responses];
    newResponses[newResponses.length > 0 ? newResponses.length - 1 : 0] = response;
    setResponses(newResponses);
    setClearField(true);
  });

  const onPrompted = async (prompt: string) => {
    try {
      const unRepliedMessageUnit: AssistantEntryData = {
        current_chain: 1,
        user_message: {
          user_id: '',
          text: prompt,
          meeting_id: getIdFromUrl(location.href),
          role: 'user',
          timestamp: new Date().toISOString(),
        }
      };
      setResponses([...responses, unRepliedMessageUnit]);
      await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt } });
      return true;
    } catch (error) {
      return false;
    }
  }

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    updatedAssistantList(responses)
  }, [responses]);

  useEffect(() => {
    setResponses(assistantList);
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
    }
  }, [])
  // mb-[120px]
  return <div ref={assistantListRef} className={`AssistantList flex flex-col mb-[60px] max-h-full w-full overflow-hidden ${className}`}>
    {responses.length ? <div className="flex-grow overflow-y-auto">
      {responses.map((entry, index) => (
        <div key={index} ref={responses.length - 1 === index ? lastEntryRef : null}>
          {entry.user_message && <AssistantEntry entryData={entry.user_message} />}
          {entry.assistant_message && <AssistantEntry entryData={entry.assistant_message} />}
        </div>
      ))}
    </div> : null}
    <AssistantInput clearField={clearField} setClearField={setClearField} onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 absolute bottom-3' />
  </div>;
}
