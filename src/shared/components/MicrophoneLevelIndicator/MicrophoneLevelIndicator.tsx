import React from 'react';

import './MicrophoneLevelIndicator.scss';

export interface MicrophoneLevelIndicatorProps {
  level?: number;
}

export function MicrophoneLevelIndicator({ level = 0 }: MicrophoneLevelIndicatorProps) {
  return <div className='MicrophoneLevelIndicator flex flex-col-reverse h-6 w-1 rounded-xl bg-[#161B26] mx-2'>
    <div className="indicator rounded-xl bg-[#9E77ED] w-full" style={{ height: `${level * 10}%` }}></div>
  </div>;
}
