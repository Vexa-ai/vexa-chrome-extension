import React, { type MutableRefObject } from "react"

import { AudioRecordingControlButton } from "./AudioRecordingControlButton"
import { VexaDragHandle } from "./VexaDragHandle"
import { VexaLogo } from "./VexaLogo"
import { VexaMinimizeButton } from "./VexaMinimizeButton"
import { VexaSettingsButton } from "./VexaSettingsButton"

export interface VexaToolbarProps {
  toolbarRef?: MutableRefObject<any>
  onDragHandleMouseOut: () => void
  onDragHandleMouseUp: () => void
  onDragHandleMouseOver: () => void
  [key: string]: any
}

export function ExtensionToolbar({
  toolbarRef,
  onDragHandleMouseOut = () => {},
  onDragHandleMouseUp = () => {},
  onDragHandleMouseOver = () => {},
  ...rest
}: VexaToolbarProps) {
  return (
    <div
      ref={toolbarRef}
      {...rest}
      className="VexaToolbar flex flex-row w-full h-9 mb-3 items-center">
      <VexaDragHandle
        className="items-center mr-3 cursor-move"
        onHandleMouseOut={onDragHandleMouseOut}
        onHandleMouseUp={onDragHandleMouseUp}
        onHandleMouseOver={onDragHandleMouseOver}
      />
      <VexaLogo />
      <div className="ml-auto gap-2 flex">
        <VexaSettingsButton />
        <VexaMinimizeButton />
        <AudioRecordingControlButton className="h-auto" />
      </div>
    </div>
  )
}
