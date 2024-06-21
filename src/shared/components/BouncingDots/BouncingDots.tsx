import React from 'react';

import './BouncingDots.scss';

export interface BouncingDotsProps {
  [key: string]: any;
}

export function BouncingDots({ className = '', ...rest }: BouncingDotsProps) {
  return <>
  <div {...rest} className={`BouncingDots bouncing-loader ${className}`}>
    <div className='dot'></div>
    <div className='dot'></div>
    <div className='dot'></div>
  </div>
</>;
}
