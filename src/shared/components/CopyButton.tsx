import copyIcon from "data-base64:~assets/images/svg/copy-05.svg"
import { CheckSquare, Copy, CopyCheck } from "lucide-react"
import React, { useEffect, useState } from "react"

export interface CopyButtonProps {
  [key: string]: any
}

export function CopyButton({
  className = "bg-background border p-1 flex gap-1 items-center justify-center rounded-lg font-medium text-primary",
  onCopy,
  ...rest
}: CopyButtonProps & { onCopy: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (copied) setCopied(false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <button
      className={`CopyButton ${className}`}
      aria-label="Copy"
      onClick={handleCopy}
      {...rest}>
      {copied ? (
        <CheckSquare className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}
