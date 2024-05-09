import React, { useRef } from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './AssistantInput.scss';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { MessageType } from '~lib/services/message-listener.service';

export interface AssistantInputProps {
  className?: string;
}

export function AssistantInput({ className = '' }: AssistantInputProps) {
  const promptInputRef = useRef<HTMLInputElement>(null);
  const messageSender = new MessageSenderService();

  const handlePromptSubmit = async (evt) => {
    evt.preventDefault();
    if(!promptInputRef.current.value?.trim()) {
      return;
    }

    try {
      const promptText = promptInputRef.current.value;
      const requestResult = await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt: promptText }});
      console.log(requestResult);
      promptInputRef.current.value = '';
    } catch(err) {
      console.error(err);
    }
    
  };

  return <div className={`AssistantInput mt-auto ${className}`}>
    <form onSubmit={handlePromptSubmit} className="flex gap-1">
      <input ref={promptInputRef} type="text" className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2" name='assistant-input' />
      <button disabled={!!promptInputRef.current?.value?.trim()} type='submit'>
        <img src={vexaLogoIcon} alt="" />
      </button>
    </form>
  </div>;
}
