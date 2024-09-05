import React, { useEffect, useRef, useState } from "react"

import { MessageType } from "~lib/services/message-listener.service"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import {
  onMessage,
  sendMessage
} from "~shared/helpers/in-content-messaging.helper"

import { ClipboardButton } from "./ClipboardButton"
import { CopyButton } from "./CopyButton"

export interface TranscriptionCopyButtonProps {
  className?: string
  onCopyTranscriptClicked: () => Promise<void>
}

export function TranscriptionCopyButton({
  className = "",
  onCopyTranscriptClicked
}: TranscriptionCopyButtonProps) {
  const [isCapturingStore] = StorageService.useHookStorage<boolean>(
    StoreKeys.CAPTURING_STATE
  )
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const clipboardBtnRef = useRef(null)

  const copyTranscription = async () => {
    await onCopyTranscriptClicked()

    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  useEffect(() => {
    const tabChangeCleanup = onMessage<{ activeTabIndex: number }>(
      MessageType.TAB_CHANGED,
      (data) => {
        setActiveTabIndex(data.activeTabIndex)
      }
    )
    const hasRecordingHistoryCleanup = onMessage<{
      hasRecordingHistory: boolean
    }>(MessageType.HAS_RECORDING_HISTORY, (data) => {
      setHasRecordingHistory(data.hasRecordingHistory)
    })

    return () => {
      tabChangeCleanup()
      hasRecordingHistoryCleanup()
    }
  }, [])

  return (
    <>
      {(isCapturingStore || hasRecordingHistory) && (
        <div
          onClick={copyTranscription}
          className={`TranscriptionCopyButton flex gap-2 items-center text-[#CECFD2] bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 cursor-pointer ${className}`}>
          <ClipboardButton clipboardRef={clipboardBtnRef} />
          <p>{copied ? "Copied Transcriptions!" : "Copy Full Transcript"}</p>
        </div>
      )}
    </>
  )
}
