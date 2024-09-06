import copyIcon from "data-base64:~assets/images/svg/copy-05.svg"
import { Copy, CopyCheck } from "lucide-react"
import React, { useEffect, useState } from "react"

export interface CopyButtonProps {
  [key: string]: any
}

export function CopyButton({
  className = "bg-background border p-1 flex gap-1 items-center justify-center rounded-lg font-medium text-primary",
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (copied) setCopied(false)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <button className={`CopyButton ${className}`} aria-label="Copy" {...rest}>
      {copied ? (
        <CopyCheck className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}
