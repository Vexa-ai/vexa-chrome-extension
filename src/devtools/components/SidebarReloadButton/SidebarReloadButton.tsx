import React from 'react';

import './SidebarReloadButton.scss';

export interface SidebarReloadButtonProps {}

export function SidebarReloadButton({}: SidebarReloadButtonProps) {
  return ( process.env.PLASMO_PUBLIC_ENVIRONMENT === 'development' && <button onClick={() => location.reload()} className='absolute top-0 left-0 w-3 h-3 z-[999999] opacity-0 hover:opacity-1'>RLD</button> );
}
