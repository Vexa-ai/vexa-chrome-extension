import checkIcon from "data-base64:~assets/images/svg/check.svg"
import microphoneIcon from "data-base64:~assets/images/svg/microphone-02.svg"
import microphoneOffIcon from "data-base64:~assets/images/svg/microphone-off-02.svg"
import React, { useEffect, useRef, useState } from "react"

import "./MicrophoneSelector.scss"

import { Mic, MicOff } from "lucide-react"

import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { useAudioCapture } from "~shared/hooks/use-audiocapture"

import { CustomSelect, type Option } from "../CustomSelect"
import { MicrophoneLevelIndicator } from "../MicrophoneLevelIndicator"

export interface MicrophoneSelectorProps {}

export function MicrophoneSelector({}: MicrophoneSelectorProps) {
  const [selectedMicrophone, setSelectedMicrophone] =
    StorageService.useHookStorage<MediaDeviceInfo & Option>(
      StoreKeys.SELECTED_MICROPHONE
    )
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [microphones, setMicrophones] = useState<
    Array<MediaDeviceInfo & Option>
  >([])
  const audioCapture = useAudioCapture()

  useEffect(() => {
    const microphoneWithLabels = audioCapture.state.availableAudioInputs?.map(
      (device) => {
        return { ...device, label: device.label, value: device.deviceId }
      }
    )
    setMicrophones(microphoneWithLabels)
  }, [audioCapture.availableAudioInputs])

  useEffect(() => {
    if (selectedMicrophone) {
      audioCapture.setSelectedAudioInputDevice(selectedMicrophone)
    } else {
      if (microphones?.length) {
        audioCapture.setSelectedAudioInputDevice(microphones[0])
      }
    }
  }, [microphones])

  const onDropdownOpenHandler = () => {
    setIsOpen(true)
    audioCapture.requestMicrophones()
  }

  const handleChange = (option: Option) => {
    const selectedMic = microphones.find(
      (microphone) => microphone.value === option[0].value
    )
    if (selectedMic) {
      audioCapture.setSelectedAudioInputDevice(selectedMic)
      setSelectedMicrophone(selectedMic)
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [dropdownRef.current])

  return (
    <div className="MicrophoneSelector flex flex-col w-full py-2">
      <label
        htmlFor="micSelect"
        className="text-primary mb-2 flex text-sm font-medium">
        Select Microphone
      </label>
      <div ref={dropdownRef}>
        <CustomSelect
          placeholder={<CustomPlaceholder />}
          selectedComponent={CustomSelected}
          options={microphones}
          isMulti={false}
          keepOpen={isOpen}
          selectedValue={selectedMicrophone}
          isSearchable={false}
          onOpen={onDropdownOpenHandler}
          onChange={handleChange}
          align="left"
          noOptionsComponent={CustomNoOption}
          optionComponent={CustomOption}
        />
      </div>
    </div>
  )
}

const CustomNoOption: React.FC = () => (
  <div
    className={`flex gap-2 items-center bg-background py-2 px-2 m-1 text-primary rounded-lg`}>
    <p className="min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full mx-auto">
      No microphones found
    </p>
  </div>
)

const CustomPlaceholder: React.FC = () => (
  <div className="flex gap-2 text-muted-foreground items-center w-full overflow-hidden">
    <MicOff className="size-5" />
    <p className="min-h-6">No microphone</p>
  </div>
)

const CustomSelected: React.FC<{ value: any; label: string }> = ({
  value,
  label
}) => (
  <div className="flex w-full items-center gap-2 overflow-hidden">
    <Mic className="size-5 text-muted-foreground" />
    <p
      className="text-primary min-h-6 mr-auto w-auto whitespace-nowrap text-ellipsis overflow-hidden"
      title={label}>
      {label}
    </p>
    <MicrophoneLevelIndicator />
  </div>
)

const CustomOption: React.FC<{
  option: Option
  selected: boolean
  onClick: () => void
}> = ({ option, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex gap-2 items-center ${selected ? "bg-[#1F242F]" : "bg-slate-950"} py-2 px-2 m-1 hover:bg-[#1F242F] text-primary rounded-lg`}>
      <p
        className="mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full"
        title={option.label}>
        {option.label}
      </p>
      {selected && <img alt="" className="w-6" src={checkIcon} />}
    </div>
  )
}
