import React from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './VexaLogo.scss';

export interface VexaLogoProps { }

export function VexaLogo({}: VexaLogoProps) {
  return <div className='VexaLogo flex gap-2 items-center'>
    <img alt='' className='w-6' src={vexaLogoIcon} />
    <h2 className="font-bold text-base text-white">Vexa</h2>
  </div>;
}
