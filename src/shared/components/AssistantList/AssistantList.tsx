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
  const assistantListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const messageSender = new MessageSenderService();

  const onPrompted = async (prompt: string) => {
    try {
      const requestResult = await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt } });
      console.log(requestResult);
      const response: AssistantEntryData[] = requestResult.data;
      console.log(response);
      setResponses(response);
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

  return <div ref={assistantListRef} className='AssistantList pt-3 flex flex-col max-h-full overflow-hidden'>
    <div className="flex-grow overflow-y-auto">
      {/* <AssistantEntry /> */}
      {responses.map((entry, index) => (
        <div key={index} ref={responses.length - 1 === index ? lastEntryRef : null}>
          <AssistantEntry entryData={entry} />
        </div>
      ))}
    </div>
    <AssistantInput onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 sticky bottom-0' />
  </div>;
}
