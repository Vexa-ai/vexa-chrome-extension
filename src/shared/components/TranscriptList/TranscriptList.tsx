import React from 'react';

import './TranscriptList.scss';
import { TranscriptEntry } from '../TranscriptEntry';

export interface TranscriptListProps {}

export function TranscriptList({}: TranscriptListProps) {
  return (
    <div className='TranscriptList pt-3'>
      <TranscriptEntry />
    </div>
  );
}
