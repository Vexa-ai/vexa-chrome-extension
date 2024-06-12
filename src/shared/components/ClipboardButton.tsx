import clipboardIcon from "data-base64:~assets/images/svg/clipboard.svg";
import React, { useEffect, useState } from "react";
import { CopySuccess } from "./CopyButton";

export interface ClipboardButtonProps {
    [key: string]: any;
}

export function ClipboardButton({
    clipboardRef = null,
    className = 'flex items-center justify-center rounded-lg font-medium text-white',
    ...rest }: ClipboardButtonProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (copied) setCopied(false);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [copied]);

    return <button ref={clipboardRef} onClick={() => setCopied(true)}  className={className} aria-label="Copy" {...rest}>
        {copied ? <CopySuccess /> : <img alt='Copy' className='w-5 h-5' src={clipboardIcon} />}
    </button>
}
