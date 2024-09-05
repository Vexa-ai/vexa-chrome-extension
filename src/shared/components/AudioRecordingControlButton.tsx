import React, { useEffect } from "react"

import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { useAudioCapture } from "~shared/hooks/use-audiocapture"

import { PauseButton } from "./PauseButton"
import { PlayButton } from "./PlayButton"

export interface AudioRecordingControlButtonProps {
  className?: string
}

export function AudioRecordingControlButton({
  className = ""
}: AudioRecordingControlButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(
    StoreKeys.CAPTURING_STATE
  )

  return (
    <div className={`${className}`}>
      {isCapturingStore ? <PauseButton /> : <PlayButton />}
    </div>
  )
}
