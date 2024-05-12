import React, { useRef } from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './AssistantInput.scss';

export interface AssistantInputProps {
  className?: string;
  onEnter: (prompt: string) => Promise<boolean>;
}

export function AssistantInput({ className = '', onEnter }: AssistantInputProps) {
  const promptInputRef = useRef<HTMLInputElement>(null);

  const handlePromptSubmit = async (evt) => {
    evt.preventDefault();
    if(!promptInputRef.current.value?.trim()) {
      return;
    }

    try {
      const promptText = promptInputRef.current.value;
      const response = await onEnter(promptText);
      if(response) {
        promptInputRef.current.value = '';
      }
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
