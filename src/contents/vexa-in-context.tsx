import customSelectCss from "data-text:../shared/components/CustomSelect/CustomSelect.scss"
import mainContentViewCss from "data-text:../shared/components/MainContentView/MainContentView.scss"
import microphoneSelectCss from "data-text:../shared/components/MicrophoneSelector/MicrophoneSelector.scss"
import transcriptListCss from "data-text:../shared/components/TranscriptList/TranscriptList.scss"
import globalCssText from "data-text:~global.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"

import { MessageListenerService } from "~lib/services/message-listener.service"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { TranscriptionEntryMode } from "~shared/components/TranscriptEntry"
import {
  getPlatform,
  Platform
} from "~shared/helpers/is-recordable-platform.helper"

import Vexa from "../shared/components/vexa/vexa"

StorageService.set(
  StoreKeys.TRANSCRIPT_MODE,
  TranscriptionEntryMode.HtmlContent
)

let matchesUrlChecker = () =>
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/.test(
    window.location.href
  )

const VexaInMeetContext = ({ onMaximizedChanged = (isMax: boolean) => {} }) => {
  const platform = getPlatform()
  // const [isYoutubeEnabled] = StorageService.useHookStorage(StoreKeys.YOUTUBE_ENABLED, false);
  const [isMaximized] = StorageService.useHookStorage<boolean>(
    StoreKeys.WINDOW_STATE,
    true
  )
  const [matchesUrl, setMatchesUrl] = useState(matchesUrlChecker())

  useEffect(() => {
    const listener = () => {
      setMatchesUrl(matchesUrlChecker())
    }

    window.navigation.addEventListener("navigate", listener)

    return () => {
      window.navigation.removeEventListener("navigate", listener)
    }
  }, [])

  useEffect(() => {
    onMaximizedChanged(isMaximized)
  }, [isMaximized])

  useEffect(() => {
    MessageListenerService.initializeListenerService()
    onMaximizedChanged(isMaximized)
  }, [])

  return (
    matchesUrl && (
      <div
        id="vexa-content-ui"
        className="fixed  z-10"
        style={{
          position: "fixed",
          zIndex: 99999999
        }}>
        {platform === Platform.MEET ? <Vexa /> : <></>}
      </div>
    )
  )
}

export default () => <></>

const maximizedChanged = () => {}

const injectUI = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(<VexaInMeetContext onMaximizedChanged={maximizedChanged} />)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectUI)
} else {
  injectUI()
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    ${globalCssText}
    ${customSelectCss}
    ${microphoneSelectCss}
    ${mainContentViewCss}
    ${transcriptListCss}
  `
  return style
}

export const config: PlasmoCSConfig = {
  matches: ["*://meet.google.com/*"],
  css: ["../assets/fonts/Inter/inter.face.scss"]
}
