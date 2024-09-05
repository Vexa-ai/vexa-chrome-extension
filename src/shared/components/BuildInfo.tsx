import React from "react"

import { VexaLogo } from "./VexaLogo"

export interface VexaBuildInfoProps {
  className?: string
}

export function BuildInfo({ className = "" }: VexaBuildInfoProps) {
  const versionNumber = chrome.runtime.getManifest()?.version

  return (
    <div
      className={`VexaBuildInfo text-gray-400 font-semibold text-center items-center flex justify-between ${className}`}>
      <VexaLogo />
      <span className="text-sm font-medium text-muted-foreground">
        {versionNumber}
      </span>
    </div>
  )
}
