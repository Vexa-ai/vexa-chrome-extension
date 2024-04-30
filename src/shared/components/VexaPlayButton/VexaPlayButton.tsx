import React from 'react';
import playIcon from "data-base64:~assets/images/svg/play-circle.svg";

import './VexaPlayButton.scss';

export interface VexaPlayButtonProps {}

export function VexaPlayButton({}: VexaPlayButtonProps) {
  return <div className='VexaPlayButton'>
    <button className='bg-[#47CD89] hover:bg-[#42a573] p-2 flex items-center justify-center rounded-lg'>
      <img className='w-5 h-5' src={playIcon} />
    </button>
    
  </div>;
}
