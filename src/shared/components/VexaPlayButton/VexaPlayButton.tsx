import React from 'react';
import playIcon from "data-base64:~assets/images/svg/play-circle.svg";

import './VexaPlayButton.scss';

export interface VexaPlayButtonProps {
  [key: string]: any;
}

export function VexaPlayButton({ ...rest }: VexaPlayButtonProps) {
  return <div {...rest} className='VexaPlayButton'>
    <button className='bg-[#9E77ED] hover:bg-[#b492f8] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
      <img className='w-5 h-5' src={playIcon} />
      <span>Start recording</span>
    </button>
    
  </div>;
}
