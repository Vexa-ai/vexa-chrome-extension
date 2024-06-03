import React from 'react';

import './VexaBuildInfo.css';

export interface VexaBuildInfoProps {
  className?: string;
}

export function VexaBuildInfo({className = ''}: VexaBuildInfoProps) {
  return <div className={`VexaBuildInfo text-gray-400 font-semibold text-center items-center flex ${className}`}>
    5.03
  </div>;
}
