import React from 'react';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import './VexaLogo.scss';
import { VexaIcon } from './VexaIcon';

export interface VexaLogoProps {
  [key: string]: any;
}

export function VexaLogo({...rest}: VexaLogoProps) {
  return <div {...rest} className='VexaLogo flex gap-2 items-center'>
    {/* <img alt='' className='w-6' src={vexaLogoIcon} /> */}
    <VexaIcon className='w-6'/>
    <h2 className="font-bold text-base text-white" onClick={() => open("https://dashboard.vexa.ai")} style={{cursor: 'pointer'}}>Vexa</h2>
  </div>;
}
