import React, { useEffect, useState } from 'react';
import pauseIcon from "data-base64:~assets/images/svg/pause-red.svg";

import './VexaPauseButton.css';

export interface VexaPauseButtonProps {
  recordedSeconds?: number;
  [key: string]: any;
}

export function VexaPauseButton({ recordedSeconds = 0, ...rest }: VexaPauseButtonProps) {
  const [recordedSecondsToMinutes, setRecordedSecondsToMinutes] = useState('0:00');

  const secondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    return { hours, minutes, seconds: remainingSeconds };
  }

  useEffect(() => {
    const {hours, minutes, seconds} = secondsToHMS(recordedSeconds);
    setRecordedSecondsToMinutes(
      `${hours > 0 ? hours + ':' : ''}${minutes.toLocaleString('en-US', { minimumIntegerDigits: 2 })}:${seconds.toLocaleString('en-US', { minimumIntegerDigits: 2 })}`); //Properly convert and format here
  }, [recordedSeconds]);

  return <div {...rest} className='VexaPauseButton'>
    <button className='bg-[#F04438] hover:bg-[#d1807a] h-9 px-2 py-2 flex gap-3 items-center justify-center rounded-3xl font-medium text-white'>
      <span className='text-base'>{recordedSecondsToMinutes}</span>
      <div className="rounded-[50%] bg-black p-1">
        <img className='w-3 h-3' src={pauseIcon} />
      </div>
      
    </button>
  </div>;
}
