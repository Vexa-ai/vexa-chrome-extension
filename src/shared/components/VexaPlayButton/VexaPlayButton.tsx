import React, { useEffect } from 'react';
import playIcon from "data-base64:~assets/images/svg/play-circle.svg";

import './VexaPlayButton.scss';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { useStorage } from '@plasmohq/storage/hook';

export interface VexaPlayButtonProps {
  [key: string]: any;
}

export function VexaPlayButton({ ...rest }: VexaPlayButtonProps) {
  const audioCapture = useAudioCapture();
  const [selectedMicrophone] = useStorage('selectedMicrophone');
  const startCapture = () => {
    audioCapture.startAudioCapture();
  }

  useEffect(() => {
  }, [selectedMicrophone]);

  return <div {...rest} className='VexaPlayButton'>
    <button disabled={!selectedMicrophone} onClick={startCapture} className='bg-[#9E77ED] hover:bg-[#b492f8] disabled:bg-[#CECFD2] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
      <img alt='' className='w-5 h-5' src={playIcon} />
      <span>Start recording</span>
    </button>
    
  </div>;
}
