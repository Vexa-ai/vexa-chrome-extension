import { Mic, MicOff } from "lucide-react"
import React, { useEffect, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/Select"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { useAudioCapture } from "~shared/hooks/use-audiocapture"

import { MicrophoneLevelIndicator } from "../MicrophoneLevelIndicator"

export interface MicrophoneSelectorProps {}

export function MicrophoneSelector({}: MicrophoneSelectorProps) {
  const [selectedMicrophone, setSelectedMicrophone] =
    StorageService.useHookStorage<MediaDeviceInfo>(
      StoreKeys.SELECTED_MICROPHONE
    )
  const [microphones, setMicrophones] = useState<Array<MediaDeviceInfo>>([])
  const audioCapture = useAudioCapture()

  useEffect(() => {
    setMicrophones(audioCapture.state.availableAudioInputs || [])
  }, [audioCapture.state.availableAudioInputs])

  useEffect(() => {
    if (selectedMicrophone) {
      audioCapture.setSelectedAudioInputDevice(selectedMicrophone)
    } else if (microphones.length) {
      audioCapture.setSelectedAudioInputDevice(microphones[0])
    }
  }, [microphones, selectedMicrophone])

  const handleChange = (value: string) => {
    const selectedMic = microphones.find(
      (microphone) => microphone.deviceId === value
    )
    if (selectedMic) {
      audioCapture.setSelectedAudioInputDevice(selectedMic)
      setSelectedMicrophone(selectedMic)
    }
  }

  return (
    <div className="flex flex-col w-full py-2">
      <label
        htmlFor="micSelect"
        className="text-primary mb-2 flex text-sm font-medium">
        Select Microphone
      </label>
      <Select onValueChange={handleChange} value={selectedMicrophone?.deviceId}>
        <SelectTrigger className="w-full bg-background border-border border text-primary">
          <SelectValue
            placeholder={
              <div className="flex gap-2 text-muted-foreground items-center w-full overflow-hidden">
                <MicOff className="size-5" />
                <p className="min-h-6">No microphone</p>
              </div>
            }>
            {selectedMicrophone && (
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <Mic className="size-5 text-muted-foreground" />
                <p
                  className="text-primary min-h-6 mr-auto w-auto whitespace-nowrap text-ellipsis overflow-hidden"
                  title={selectedMicrophone.label}>
                  {selectedMicrophone.label}
                </p>
                <MicrophoneLevelIndicator />
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="dark bg-background border border-border z-[9999999999999]">
          {microphones.length > 0 ? (
            microphones.map((mic) => (
              <SelectItem key={mic.deviceId} value={mic.deviceId}>
                <p
                  className="mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full"
                  title={mic.label}>
                  {mic.label}
                </p>
              </SelectItem>
            ))
          ) : (
            <p className="min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full mx-auto">
              No microphones found
            </p>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
