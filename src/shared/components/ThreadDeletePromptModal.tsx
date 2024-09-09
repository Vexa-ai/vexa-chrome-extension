import { Trash2 } from "lucide-react"
import React, { useEffect, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/Dialog"
import {
  MessageListenerService,
  MessageType
} from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import { onMessage } from "~shared/helpers/in-content-messaging.helper"

import { BouncingDots } from "./BouncingDots"
import type { Option } from "./CustomSelect"

export interface ThreadDeletePromptModalProps {
  deleteThread: Function
}

export function ThreadDeletePromptModal({
  deleteThread
}: ThreadDeletePromptModalProps) {
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [isDeletingThread, setIsDeletingThread] = useState(false)
  const [threadData, setThreadData] = useState<Option>()
  const messageSender = new MessageSenderService()

  const closeModal = () => {
    setIsDeletingThread(false)
    setShowEditorModal(false)
  }

  useEffect(() => {
    const deleteThreadEditorCleanup = onMessage(
      MessageType.DELETE_THREAD_START,
      (message: { thread: Option }) => {
        setThreadData(message.thread)
        // setInitialThread(ThreadData.Thread || '');
        setShowEditorModal(true)
      }
    )

    const deleteThreadEditorCompletedCleanup = onMessage(
      MessageType.DELETE_THREAD_COMPLETE,
      () => {
        closeModal()
      }
    )

    return () => {
      deleteThreadEditorCleanup()
      deleteThreadEditorCompletedCleanup()
    }
  }, [])

  return (
    <Dialog open={showEditorModal} onOpenChange={setShowEditorModal}>
      <DialogContent className="z-[99999999999] dark">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Thread
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete thread{" "}
          <span className="font-medium text-foreground">
            "{threadData?.label.substring(0, 50)}"
          </span>
          ?
        </p>
        <DialogFooter>
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => deleteThread(threadData)}
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
            {isDeletingThread ? (
              <BouncingDots className="py-[10px]" />
            ) : (
              "Delete Thread"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
