import React, { useEffect, useRef, useState } from 'react';

import './AssistantList.scss';
import { AssistantEntry } from '../AssistantEntry';
import { AssistantInput } from '../AssistantInput';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { MessageSenderService } from '~lib/services/message-sender.service';

export interface AssistantEntryData {
  content: string;
  context_id: string;
  role: string;
  timestamp: string;
  user_id: string;
};

export interface AssistantListProps { }

export function AssistantList({ }: AssistantListProps) {

  const [responses, setResponses] = useState<AssistantEntryData[]>([]);
  const [clearField, setClearField] = useState<boolean>(false);
  const assistantListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const messageSender = new MessageSenderService();

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_RESULT, (message) => {
    const response: AssistantEntryData[] = message.data;
      console.log(response);
      setResponses(response);
      setClearField(true);
  });

  const onPrompted = async (prompt: string) => {
    try {
      const requestResult = await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt } });
      console.log(requestResult);
      return true;
    } catch (error) {
      return false;
    }
  }

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses]);

  useEffect(() => {
    return () => {
      MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
    }
  }, [])

  return <div ref={assistantListRef} className='AssistantList flex flex-col mb-11 max-h-full w-full overflow-hidden'>
    <div className="flex-grow overflow-y-auto">
      {responses.map((entry, index) => (
        <div key={index} ref={responses.length - 1 === index ? lastEntryRef : null}>
          <AssistantEntry entryData={entry} />
        </div>
      ))}
    </div>
    <AssistantInput clearField={clearField} setClearField={setClearField} onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 absolute w-full bottom-0' />
  </div>;
}
