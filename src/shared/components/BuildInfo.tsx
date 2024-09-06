import React from "react"

import { VexaLogo } from "./VexaLogo"

export interface VexaBuildInfoProps {
  className?: string
}

export function BuildInfo({ className = "" }: VexaBuildInfoProps) {
  const versionNumber = chrome.runtime.getManifest()?.version

  return (
    <div
      className={`font-semibold text-center w-full px-4 items-center flex justify-between ${className}`}>
      <VexaLogo />
      <span className="text-sm font-medium text-muted-foreground">
        {versionNumber}
      </span>
    </div>
  )
}
