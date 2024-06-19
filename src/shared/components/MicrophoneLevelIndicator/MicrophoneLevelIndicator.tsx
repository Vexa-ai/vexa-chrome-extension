import React, { useState } from 'react';

import './MicrophoneLevelIndicator.scss';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';

export interface MicrophoneLevelIndicatorProps { }

export function MicrophoneLevelIndicator({ }: MicrophoneLevelIndicatorProps) {
  const [micLevel, setMicLevel] = useState(0);
  MessageListenerService.unRegisterMessageListener(MessageType.MICROPHONE_LEVEL_STATUS);
  MessageListenerService.registerMessageListener(MessageType.MICROPHONE_LEVEL_STATUS, (evtData) => {
    setMicLevel(evtData?.data?.level || 0);
  });

  return <div className='MicrophoneLevelIndicator flex flex-col-reverse h-6 w-1 rounded-xl bg-[#161B26] mx-2'>
    <div className="indicator rounded-xl bg-[#9E77ED] w-full" style={{ height: `${micLevel * 150}%`, transition: 'height 0.2s ease-in-out' }}></div>
  </div>;
}
