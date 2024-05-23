import React, { useEffect, useState } from 'react';

import './MicrophoneLevelIndicator.scss';
import type { MicrophoneLevelInfo } from '~shared/interfaces/microphone-level.interface';
import { StorageService, StoreKeys } from '~lib/services/storage.service';

export interface MicrophoneLevelIndicatorProps {}

export function MicrophoneLevelIndicator({}: MicrophoneLevelIndicatorProps) {
  // const [micLevel, setMicLevel] = useState(0);
  const [micLevelState] = StorageService.useHookStorage<MicrophoneLevelInfo>(StoreKeys.MIC_LEVEL_STATE, { level: 0, pointer: 0 });


  useEffect(() => {
    // MessageListenerService.unRegisterMessageListener(MessageType.MIC_LEVEL_STREAM_RESULT);
    // MessageListenerService.registerMessageListener(MessageType.MIC_LEVEL_STREAM_RESULT, (evtData) => {
    //   // setMicLevel(micLevelState?.level || 0);
    // });
    // console.log(micLevelState);
  }, [micLevelState]);
  
  return <div className='MicrophoneLevelIndicator flex flex-col-reverse h-6 w-1 rounded-xl bg-[#161B26] mx-2'>
    <div className="indicator rounded-xl bg-[#9E77ED] w-full" style={{ height: `${micLevelState.level * 150}%`, transition: 'height 0.2s ease-in-out'  }}></div>
  </div>;
}
