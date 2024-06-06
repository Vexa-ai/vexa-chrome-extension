import React, { useEffect, useRef, useState } from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './AssistantInput.scss';
import { AssistantSuggestions } from '../AssistantSuggestions';

export interface AssistantInputProps {
  className?: string;
  onEnter: (prompt: string) => Promise<boolean>;
  clearField: boolean;
  setClearField: (clear: boolean) => void;
}

export function AssistantInput({ className = '', onEnter, clearField, setClearField }: AssistantInputProps) {
  const promptInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([
    'Write key points from Competitor Analysis Report ',
    'Summarize what was discussed',
    'List key issues discussed',
  ]);

  const handlePromptSubmit = async (evt) => {
    evt.preventDefault();
    if (!promptInputRef.current.value?.trim()) {
      return;
    }
    const promptText = promptInputRef.current.value;
    const canClearField = await onEnter(promptText);
    if (canClearField && promptInputRef.current) {
      promptInputRef.current.value = '';
    }
  };

  const handleSuggestionSelection = (index: number) => {
    promptInputRef.current.value = suggestions[index];
    submitBtnRef.current.click();
  }

  useEffect(() => {
    if (clearField) {
      promptInputRef.current.value = '';
      setClearField(false);
    }
  }, [clearField, setClearField]);

  return <div className={`AssistantInput mt-auto ${className}`}>
    {/* <AssistantSuggestions suggestions={suggestions} selectSuggestion={handleSuggestionSelection}/> */}
    <form autoComplete="off" ref={formRef} onSubmit={handlePromptSubmit} className="flex gap-1">
      <input ref={promptInputRef} type="text" placeholder='Start typing...' className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2" name='assistant-input' />
      <button ref={submitBtnRef} disabled={!!promptInputRef.current?.value?.trim()} type='submit'>
        <img src={vexaLogoIcon} alt="" />
      </button>
    </form>
  </div>;
}
