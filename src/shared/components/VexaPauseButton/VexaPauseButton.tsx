import React, { useEffect, useState } from 'react';
import pauseIcon from "data-base64:~assets/images/svg/pause-red.svg";

import './VexaPauseButton.css';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { useStorage } from '@plasmohq/storage/hook';
import CountUp, { useCountUp } from 'react-countup';
import { useStopwatch } from 'react-timer-hook';

export interface VexaPauseButtonProps {
  // recordedSeconds?: number;
  [key: string]: any;
}

export function VexaPauseButton({ ...rest }: VexaPauseButtonProps) {
  const [storedStartTime] = StorageService.useHookStorage<number>(StoreKeys.RECORD_START_TIME);
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [timeElapsed, setTimeElapsed] = useState(0);
  useCountUp({ ref: 'counter', end: 100000 });
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
  } = useStopwatch({ autoStart: true });

  const audioCapture = useAudioCapture();

  useEffect(() => {
    console.log({storedStartTime, timeElapsed});
    if (storedStartTime) {
      setTimeElapsed(() => new Date().getTime() - storedStartTime);
    }
  }, [storedStartTime]);

  return <div {...rest} className='VexaPauseButton'>
    <div className='bg-[#F04438] hover:bg-[#d1807a] h-9 px-2 py-2 flex gap-3 items-center justify-center rounded-3xl font-medium text-white'>
      <span className='text-base'>{hours < 1 ? '' : hours + ':'}{minutes < 10 ? '0' + minutes : minutes}:{seconds < 10 ? '0' + seconds : seconds}</span>
      <button className="rounded-[50%] bg-black p-1 cursor-pointer" onClick={() => audioCapture.stopAudioCapture()}>
        <img alt='' className='w-3 h-3' src={pauseIcon} />
      </button>
    </div>
  </div>;
}
