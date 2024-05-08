import React from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './AssistantInput.scss';

export interface AssistantInputProps {
  className?: string;
}

export function AssistantInput({ className = '' }: AssistantInputProps) {
  return <div className={`AssistantInput mt-auto ${className}`}>
    <div className="flex gap-1">
      <input type="text" className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2" name='assistant-input' />
      <button>
        <img src={vexaLogoIcon} alt="" />
      </button>
    </div>
  </div>;
}
