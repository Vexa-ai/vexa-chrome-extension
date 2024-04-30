import React from 'react';

import './VexaPauseButton.css';

export interface VexaPauseButtonProps {
  prop?: string;
}

export function VexaPauseButton({prop = 'default value'}: VexaPauseButtonProps) {
  return <div className='VexaPauseButton'>VexaPauseButton {prop}</div>;
}
