import React from 'react';
import settingsIcon from "data-base64:~assets/images/svg/gear.svg";
import './VexaSettingsButton.scss';
import {MessageType} from "~lib/services/message-listener.service";
import {MessageSenderService} from "~lib/services/message-sender.service";

const messageSender = new MessageSenderService();

export interface VexaSettingsButtonProps {

}

export function VexaSettingsButton({ ...rest }: VexaSettingsButtonProps) {
  const openOptions = () => {
    messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS });
  }

  return (
    <div {...rest} className='VexaSettingsButton'>
      <button onClick={openOptions} className='bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
        <img alt='' className='w-5 h-5' src={settingsIcon} />
      </button>
    </div>
  );
}
