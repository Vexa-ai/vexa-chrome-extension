import React from "react"

import { MicrophoneHints } from "./MicrophoneHints"
import { MicrophoneSelector } from "./MicrophoneSelector"

export interface MicrophoneOptionsProps {
  className?: string
}

export function MicrophoneOptions({ className = "" }: MicrophoneOptionsProps) {
  return (
    <div className={`MicrophoneOptions flex flex-col w-full px-4 ${className}`}>
      <MicrophoneSelector />
      <MicrophoneHints className="mt-2" />
    </div>
  )
}
