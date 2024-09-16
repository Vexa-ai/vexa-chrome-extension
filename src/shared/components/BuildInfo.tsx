import React from "react"

import { SettingsButton } from "./SettingsButton"
import { VexaLogo } from "./VexaLogo"

export interface VexaBuildInfoProps {
  className?: string
  hideLogo?: boolean
}

export function BuildInfo({
  className = "",
  hideLogo = false
}: VexaBuildInfoProps) {
  const versionNumber = chrome.runtime.getManifest()?.version

  return (
    <div
      className={`font-semibold text-center w-full px-4 items-center flex justify-between ${className}`}>
      <div className="flex items-center gap-2">
        {!hideLogo && <VexaLogo />}
        <span className="text-sm font-medium text-muted-foreground">
          {versionNumber}
        </span>
      </div>
      {!hideLogo && <SettingsButton />}
    </div>
  )
}
