import React, { type MutableRefObject } from "react"

import { AudioRecordingControlButton } from "./AudioRecordingControlButton"
import { DragHandle } from "./DragHandle"
import { MinimizeButton } from "./MinimizeButton"
import { SettingsButton } from "./SettingsButton"
import { VexaLogo } from "./VexaLogo"

export interface VexaToolbarProps {
  toolbarRef?: MutableRefObject<any>
  onDragHandleMouseOut: () => void
  onDragHandleMouseUp: () => void
  onDragHandleMouseOver: () => void
  [key: string]: any
}

export function Toolbar({
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
      className="VexaToolbar flex flex-row w-full h-9 mb-3 px-4 items-center">
      <DragHandle
        className="items-center mr-3 cursor-move p-3"
        onHandleMouseOut={onDragHandleMouseOut}
        onHandleMouseUp={onDragHandleMouseUp}
        onHandleMouseOver={onDragHandleMouseOver}
      />
      <div className="ml-auto flex items-center gap-2">
        <MinimizeButton />
        <AudioRecordingControlButton className="h-auto" />
      </div>
    </div>
  )
}
