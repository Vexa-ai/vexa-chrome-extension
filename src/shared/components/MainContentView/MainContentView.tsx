import React, { useEffect, useState } from "react"

import "./MainContentView.scss"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/Tabs"
import { MessageType } from "~lib/services/message-listener.service"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import {
  onMessage,
  sendMessage
} from "~shared/helpers/in-content-messaging.helper"

import { AssistantList } from "../AssistantList"
import type { TranscriptionEntryData } from "../TranscriptEntry"
import { TranscriptList, type ActionButton } from "../TranscriptList"

export interface MainContentViewProps {
  [key: string]: any
}

let transcriptList: TranscriptionEntryData[] = []
let activeTabIndex = 0

export function MainContentView({ className, ...rest }: MainContentViewProps) {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [hasTranscripts, setHasTranscripts] = useState(false)
  const [isCapturing] = StorageService.useHookStorage<boolean>(
    StoreKeys.CAPTURING_STATE
  )
  const [hasRecordingHistory, setHasRecordingHistory] = useState(false)

  const [actionButtonClicked, setActionButtonClicked] =
    useState<ActionButton>(null)
  const [assistantMessage, setAssistantMessage] = useState<string>(null)

  const copyTranscriptions = () => {
    const mergedTranscripts = transcriptList
      .map((transcript) => {
        return `${transcript.speaker}: ${transcript.content}`
      })
      .join("\n")
    navigator.clipboard.writeText(mergedTranscripts)
  }

  const onListUpdated = (list: TranscriptionEntryData[]) => {
    transcriptList = list
    setHasTranscripts(!!transcriptList.length)
  }

  const onTabChanged = (currentTabIndex: number) => {
    activeTabIndex = currentTabIndex
    setSelectedTabIndex(currentTabIndex)
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex: currentTabIndex })
  }

  useEffect(() => {
    sendMessage(MessageType.HAS_RECORDING_HISTORY, { hasRecordingHistory })
  }, [hasRecordingHistory])

  useEffect(() => {
    const transcriptionCleanupFn = onMessage(
      MessageType.COPY_TRANSCRIPTION,
      () => {
        copyTranscriptions()
        sendMessage(MessageType.COPY_TRANSCRIPTION_SUCCESS)
      }
    )

    setSelectedTabIndex(activeTabIndex)
    sendMessage(MessageType.TAB_CHANGED, { activeTabIndex: activeTabIndex })
    sendMessage(MessageType.HAS_RECORDING_HISTORY, {
      hasRecordingHistory: !!transcriptList.length
    })

    const hasRecordingHistoryCleanup = onMessage<{
      hasRecordingHistory: boolean
    }>(MessageType.HAS_RECORDING_HISTORY, (data) => {
      setHasRecordingHistory(data.hasRecordingHistory)
    })
    return () => {
      transcriptionCleanupFn()
      hasRecordingHistoryCleanup()
    }
  }, [])

  function onActionButtonClicked(button: ActionButton) {
    setActionButtonClicked(button)

    setSelectedTabIndex(1)
  }

  function onAssistantMessage(message: string) {
    setAssistantMessage(message)

    setSelectedTabIndex(1)
  }

  return (
    <div
      {...rest}
      className={`MainContentView flex flex-col flex-grow overflow-hidden h-auto ${className}`}>
      <Tabs
        value={selectedTabIndex.toString()}
        onValueChange={(value) => onTabChanged(parseInt(value))}
        className="h-[calc(100%-46px)]">
        <TabsList className="grid w-full grid-cols-2 px-4">
          <TabsTrigger value="0">Transcript</TabsTrigger>
          <TabsTrigger value="1">Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="0" className="h-full">
          <TranscriptList
            className=""
            transcriptList={transcriptList}
            updatedTranscriptList={(list) => onListUpdated(list)}
            onActionButtonClicked={onActionButtonClicked}
            onAssistantRequest={onAssistantMessage}
          />
        </TabsContent>
        <TabsContent value="1" className="h-full">
          <AssistantList
            actionButtonClicked={actionButtonClicked}
            assistantMessage={assistantMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
