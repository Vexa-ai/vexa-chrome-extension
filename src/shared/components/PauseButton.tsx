import pauseIcon from "data-base64:~assets/images/svg/pause-red.svg"
import { Square } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useStopwatch } from "react-timer-hook"

import { Button } from "~components/ui/Button"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { useAudioCapture } from "~shared/hooks/use-audiocapture"

export interface VexaPauseButtonProps {
  [key: string]: any
}

export function PauseButton({ ...rest }: VexaPauseButtonProps) {
  const [storedStartTime] = StorageService.useHookStorage<number>(
    StoreKeys.RECORD_START_TIME
  )
  const [timeElapsed, setTimeElapsed] = useState(0)

  const {
    totalSeconds,
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    reset
  } = useStopwatch()

  const audioCapture = useAudioCapture()

  const onStopClicked = () => {
    audioCapture.stopAudioCapture()
    window.open(process.env.PLASMO_PUBLIC_DASHBOARD_URL, "__blank")
  }

  useEffect(() => {
    if (storedStartTime) {
      const elapsedTime = new Date().getTime() - storedStartTime
      setTimeElapsed(() => elapsedTime)
      const startTimeDate = new Date(storedStartTime)
      const currentTime = new Date()

      // Calculate total time difference and adjust current time
      const timeDifference = currentTime.getTime() - startTimeDate.getTime()
      currentTime.setTime(currentTime.getTime() + timeDifference)
      reset(currentTime, true)
    }
  }, [storedStartTime])

  return (
    <div {...rest}>
      <Button
        onClick={onStopClicked}
        variant="ghost"
        className="flex gap-1 items-center justify-center">
        <Square size={16} className="fill-red-500 text-red-500" />
        <span className={`${hours === 0 ? "w-12" : "w-16"} text-base`}>
          {hours < 1 ? "" : hours + ":"}
          {minutes < 10 ? "0" + minutes : minutes}:
          {seconds < 10 ? "0" + seconds : seconds}
        </span>
      </Button>
    </div>
  )
}
