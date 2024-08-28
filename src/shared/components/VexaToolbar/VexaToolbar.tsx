import React, { type MutableRefObject } from 'react';

import './VexaToolbar.css';
import { AudioRecordingControlButton } from '../AudioRecordingControlButton';
import { VexaLogo } from '../VexaLogo';
import { VexaMinimizeButton } from '../VexaMinimizeButton';
import { VexaDragHandle } from '../VexaDragHandle';
import {VexaSettingsButton} from "../VexaSettingsButton";

export interface VexaToolbarProps {
  toolbarRef?: MutableRefObject<any>;
  onDragHandleMouseOut: () => void;
  onDragHandleMouseUp: () => void;
  onDragHandleMouseOver: () => void;
  [key: string]: any;
}

export function VexaToolbar({ toolbarRef, onDragHandleMouseOut = () => {}, onDragHandleMouseUp = () => {}, onDragHandleMouseOver = () => {}, ...rest }: VexaToolbarProps) {
  
  return <div ref={toolbarRef} {...rest} className='VexaToolbar flex flex-row w-full h-9 mb-3 items-center'>
    <VexaDragHandle className='items-center mr-1 cursor-move' onHandleMouseOut={onDragHandleMouseOut} onHandleMouseUp={onDragHandleMouseUp} onHandleMouseOver={onDragHandleMouseOver} />
    <VexaLogo />
    <div className='ml-auto gap-2 flex'>
      <VexaSettingsButton />
      <VexaMinimizeButton />
      <AudioRecordingControlButton className='h-auto'/>
    </div>
    
  </div>;
}
