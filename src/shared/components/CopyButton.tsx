import copyIcon from "data-base64:~assets/images/svg/copy-05.svg";
import React from "react";

export interface CopyButtonProps {
    [key: string]: any;
}

export function CopyButton({
    className = 'bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white',
    ...rest }: CopyButtonProps) {
    return <button className={className} aria-label="Copy" {...rest}>
        <img alt='Copy' className='w-5 h-5' src={copyIcon} />
    </button>
}
