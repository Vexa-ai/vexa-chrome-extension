import copyIcon from "data-base64:~assets/images/svg/copy-05.svg";
import React, { useEffect, useState } from "react";

export interface CopyButtonProps {
    [key: string]: any;
}

export interface CopySuccessProps {
    [key: string]: any;
}

export function CopyButton({
    className = 'bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white',
    ...rest }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (copied) setCopied(false);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [copied]);

    return <button className={className} aria-label="Copy" {...rest}>
        {copied ? <CopySuccess /> : <img onClick={() => setCopied(true)} alt='Copy' className='w-5 h-5' src={copyIcon} />}
    </button>
}

export function CopySuccess({ stroke = '#fff', ...rest }: CopySuccessProps) {
    return <svg {...rest} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}
