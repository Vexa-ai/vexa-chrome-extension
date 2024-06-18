import React, { useEffect, useState } from 'react';
import pauseIcon from "data-base64:~assets/images/svg/pause-red.svg";

import './VexaPauseButton.css';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { useStopwatch } from 'react-timer-hook';

export interface VexaPauseButtonProps {
  [key: string]: any;
}

export function VexaPauseButton({ ...rest }: VexaPauseButtonProps) {
  const [storedStartTime] = StorageService.useHookStorage<number>(StoreKeys.RECORD_START_TIME);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const {
    totalSeconds,
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    reset,
  } = useStopwatch();

  const audioCapture = useAudioCapture();

  const onStopClicked = () => {
    audioCapture.stopAudioCapture()
    window.open(process.env.PLASMO_PUBLIC_DASHBOARD_URL, '__blank');
  }

  useEffect(() => {
    if (storedStartTime) {
      const elapsedTime = new Date().getTime() - storedStartTime;
      setTimeElapsed(() => elapsedTime);
      const startTimeDate = new Date(storedStartTime);
      const currentTime = new Date();

      // Calculate total time difference and adjust current time
      const timeDifference = currentTime.getTime() - startTimeDate.getTime();
      currentTime.setTime(currentTime.getTime() + timeDifference);
      reset(currentTime, true);
    }
  }, [storedStartTime]);

  return <div {...rest} className='VexaPauseButton'>
    <div onClick={onStopClicked} className='bg-[#F04438] hover:bg-[#d1807a] h-auto px-2 py-2 flex gap-3 items-center justify-center rounded-3xl font-medium text-white cursor-pointer'>
      <span className={`${hours === 0 ? 'w-10' : 'w-16'} text-base`}>{hours < 1 ? '' : hours + ':'}{minutes < 10 ? '0' + minutes : minutes}:{seconds < 10 ? '0' + seconds : seconds}</span>
      <button className="rounded-[50%] bg-black p-1">
        <img alt='' className='w-3 h-3' src={pauseIcon} />
      </button>
    </div>
  </div>;
}
