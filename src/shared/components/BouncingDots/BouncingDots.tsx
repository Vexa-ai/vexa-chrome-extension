import React from 'react';

import './BouncingDots.scss';

export interface BouncingDotsProps {
  prop?: string;
}

export function BouncingDots({ ...rest }: BouncingDotsProps) {
  return <>
  <div {...rest} className="BouncingDots bouncing-loader">
    <div className='dot'></div>
    <div className='dot'></div>
    <div className='dot'></div>
  </div>
</>;
}
