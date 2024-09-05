import React from "react"

import { MicrophoneHints, MicrophoneStatus } from "./MicrophoneHints"
import { MicrophoneSelector } from "./MicrophoneSelector"

export interface MicrophoneOptionsProps {
  className?: string
}

export function MicrophoneOptions({ className = "" }: MicrophoneOptionsProps) {
  return (
    <div className={`MicrophoneOptions flex flex-col w-full ${className}`}>
      <MicrophoneSelector />
      <MicrophoneHints className="mt-2" />
    </div>
  )
}
