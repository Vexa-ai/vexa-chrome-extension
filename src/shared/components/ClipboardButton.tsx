import clipboardIcon from "data-base64:~assets/images/svg/clipboard.svg"
import { Copy, CopyCheck } from "lucide-react"
import React, { useEffect, useState } from "react"

export interface ClipboardButtonProps {
  [key: string]: any
}

export function ClipboardButton({
  clipboardRef = null,
  className = "flex items-center justify-center rounded-lg font-medium text-primary",
  ...rest
}: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (copied) setCopied(false)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <button
      ref={clipboardRef}
      onClick={() => setCopied(true)}
      className={className}
      aria-label="Copy"
      {...rest}>
      {copied ? (
        <CopyCheck className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}
