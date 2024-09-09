import { Edit, X } from "lucide-react"
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

export interface SpeakerEditorModalProps {}

export function SpeakerEditorModal({}: SpeakerEditorModalProps) {
  const [speakerData, setSpeakerData] = useState<any>({})
  const [initialSpeaker, setInitialSpeaker] = useState<string>("")
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [isUpdatingSpeakerName, setIsUpdatingSpeakerName] = useState(false)
  const messageSender = new MessageSenderService()

  const closeModal = () => {
    setIsUpdatingSpeakerName(false)
    setShowEditorModal(false)
  }

  const updateSpeakerName = () => {
    setIsUpdatingSpeakerName(true)
    messageSender.sendBackgroundMessage({
      type: MessageType.UPDATE_SPEAKER_NAME_REQUEST,
      data: {
        speaker_id: speakerData.speaker_id,
        alias: speakerData.speaker
      }
    })
  }

  useEffect(() => {
    const speakerEditorCleanup = onMessage(
      MessageType.SPEAKER_EDIT_START,
      (speakerData: any) => {
        setSpeakerData(speakerData)
        setInitialSpeaker(speakerData.speaker || "")
        setShowEditorModal(true)
      }
    )

    const speakerEditorCompletedCleanup = onMessage(
      MessageType.SPEAKER_EDIT_COMPLETE,
      (speakerData: any) => {
        closeModal()
      }
    )

    return () => {
      speakerEditorCleanup()
      speakerEditorCompletedCleanup()
      MessageListenerService.unRegisterMessageListener(
        MessageType.UPDATE_SPEAKER_NAME_RESULT
      )
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeakerData({ ...speakerData, speaker: e.target.value })
  }

  return (
    <Dialog open={showEditorModal} onOpenChange={setShowEditorModal}>
      <DialogContent className="z-[99999999999] dark">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Edit className="h-5 w-5 text-primary" />
            Change Speaker Name
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mb-6">
          <label htmlFor="name" className="text-sm text-muted-foreground">
            Name
          </label>
          <input
            value={speakerData.speaker || ""}
            onChange={handleInputChange}
            type="text"
            placeholder="Update speaker name"
            className="flex-grow rounded-lg border border-input bg-background px-3 py-2 text-sm text-primary"
            name="name"
          />
        </div>
        <DialogFooter>
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button
            disabled={
              isUpdatingSpeakerName ||
              speakerData.speaker?.trim() === initialSpeaker ||
              !speakerData.speaker?.trim()
            }
            onClick={updateSpeakerName}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isUpdatingSpeakerName ? (
              <BouncingDots className="py-[10px]" />
            ) : (
              "Confirm"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
