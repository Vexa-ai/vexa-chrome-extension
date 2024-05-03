import React from 'react';
import playIcon from "data-base64:~assets/images/svg/play-circle.svg";

import './VexaPlayButton.scss';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';

export interface VexaPlayButtonProps {
  [key: string]: any;
}

export function VexaPlayButton({ ...rest }: VexaPlayButtonProps) {
  const audioCapture = useAudioCapture();

  return <div {...rest} className='VexaPlayButton'>
    {/* This should be for selected audio input device: disabled={audioCapture.availableAudioInputs.length === 0} */}
    <button onClick={() => audioCapture.startAudioCapture()} className='bg-[#9E77ED] hover:bg-[#b492f8] disabled:bg-[#CECFD2] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
      <img alt='' className='w-5 h-5' src={playIcon} />
      <span>Start recording</span>
    </button>
    
  </div>;
}
