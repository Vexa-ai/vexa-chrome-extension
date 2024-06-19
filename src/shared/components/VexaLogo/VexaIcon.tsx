import React from 'react';

export interface VexaIconProps {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: string;
    [key: string]: any;
}

export function VexaIcon({ fillColor = 'none', strokeColor = '#9E77ED', strokeWidth = '2.25', ...rest }: VexaIconProps) {
    return <svg {...rest} width="25" height="25" viewBox="0 0 25 25" fill={fillColor} xmlns="http://www.w3.org/2000/svg">
        <g id="microphone-02">
            <path id="Icon" d="M20.25 12.2485V13.2485C20.25 17.6668 16.6683 21.2485 12.25 21.2485C7.83172 21.2485 4.25 17.6668 4.25 13.2485V12.2485M12.25 17.2485C10.0409 17.2485 8.25 15.4577 8.25 13.2485V7.24853C8.25 5.0394 10.0409 3.24854 12.25 3.24854C14.4591 3.24854 16.25 5.0394 16.25 7.24854V13.2485C16.25 15.4577 14.4591 17.2485 12.25 17.2485Z" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </g>
    </svg>
        ;
}
