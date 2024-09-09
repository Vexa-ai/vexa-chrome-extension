import closeIcon from "data-base64:~assets/images/svg/x-close.svg"
import { MicOff } from "lucide-react"
import React, { useContext, useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Alert, AlertTitle } from "~components/ui/Alert"
import {
  MessageListenerService,
  MessageType
} from "~lib/services/message-listener.service"
import { StorageService, StoreKeys } from "~lib/services/storage.service"

export enum MicrophoneStatus {
  MUTED = "MUTED",
  SELECTED = "SELECTED",
  RECORDING = "RECORDING"
}

export interface MicrophoneHintsProps {
  className?: string
}

export function MicrophoneHints({ className = "" }: MicrophoneHintsProps) {
  const [isClosed, setIsClosed] = useState(false)
  const [status, setStatus] = useState(MicrophoneStatus.MUTED)
  const [selectedMicrophone] = StorageService.useHookStorage(
    StoreKeys.SELECTED_MICROPHONE
  )

  const closeSelf = () => {
    setIsClosed(true)
  }

  MessageListenerService.unRegisterMessageListener(
    MessageType.ON_MICROPHONE_SELECTED
  )
  MessageListenerService.registerMessageListener(
    MessageType.ON_MICROPHONE_SELECTED,
    (evtData) => {
      setStatus(
        evtData.data?.device
          ? MicrophoneStatus.SELECTED
          : MicrophoneStatus.MUTED
      )
    }
  )

  useEffect(() => {
    setIsClosed(false)
  }, [selectedMicrophone])

  return (
    <div className={`MicrophoneHints ${className}`}>
      {!selectedMicrophone && (
        <Alert className="relative">
          <MicOff className="h-4 w-4" />
          <AlertTitle>
            {" "}
            {!selectedMicrophone && (
              <p>Please enable microphone permissions to choose a microphone</p>
            )}
          </AlertTitle>
        </Alert>
      )}
    </div>
  )
}
