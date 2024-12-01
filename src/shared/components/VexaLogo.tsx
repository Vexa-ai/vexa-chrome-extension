import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg"
import React from "react"

import { VexaIcon } from "./VexaIcon"

export interface VexaLogoProps {
  [key: string]: any
}

export function VexaLogo({ ...rest }: VexaLogoProps) {
  return (
    <div {...rest} className="VexaLogo flex gap-1 items-center">
      <VexaIcon size="16" />
      <h2
        className="font-semibold text-primary"
        onClick={() => open("https://vexa.ai/app")}
        style={{ cursor: "pointer" }}>
        Vexa
      </h2>
    </div>
  )
}
