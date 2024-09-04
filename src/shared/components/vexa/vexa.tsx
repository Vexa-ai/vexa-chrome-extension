import React, { useEffect, useRef, useState } from "react"
import Draggable, {
  type DraggableData,
  type DraggableEvent
} from "react-draggable"
import { NotificationContainer } from "react-notifications"

import AsyncMessengerService from "~lib/services/async-messenger.service"
import ChatManager from "~lib/services/chat-manager"
import { MessageType } from "~lib/services/message-listener.service"
import {
  StorageService,
  StoreKeys,
  type AuthorizationData
} from "~lib/services/storage.service"
import {
  MainContentView,
  MicrophoneOptions,
  SpeakerEditorModal,
  VexaBuildInfo,
  VexaToolbar
} from "~shared/components"
import { sendMessage } from "~shared/helpers/in-content-messaging.helper"
import { getIdFromUrl } from "~shared/helpers/meeting.helper"
import {
  AudioCaptureContext,
  useAudioCapture
} from "~shared/hooks/use-audiocapture"

const chatManager = new ChatManager()

const asyncMessengerService = new AsyncMessengerService()

const MEETING_ID = getIdFromUrl(window.location.href)

const Vexa = () => {
  const audioCapture = useAudioCapture()
  const [isCapturing] = StorageService.useHookStorage<boolean>(
    StoreKeys.CAPTURING_STATE
  )
  const [isMaximized] = StorageService.useHookStorage<boolean>(
    StoreKeys.WINDOW_STATE,
    true
  )
  const [hasRecorded, setHasRecorded] = useState(false)
  const [isDraggableDisabled, setIsDraggableDisabled] = useState(true)
  const vexaToolbarRef = useRef(null)
  const defaultPosition = { x: 0, y: 0 }
  const [position, setPosition] = useState(defaultPosition)
  const [outdated, setOutdated] = useState(false)
  const [outdatedClosed, setOutdatedClosed] = useState(false)
  const [latestVersion, setLatestVersion] = useState(0)

  useEffect(() => {
    if (isCapturing) {
      StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: ""
      }).then((authData) => {
        asyncMessengerService
          .getRequest(`/api/v1/users/me?token=${authData["__vexa_token"]}`)
          .then(async (res) => {
            console.log({ res })
            console.log({ allowed: res["is_allowed_send_init_message"] })

            if (true === res["is_allowed_send_init_message"]) {
              console.log("Sending message")
              asyncMessengerService
                .getRequest(
                  `/api/v1/meetings/initial-message?token=${authData["__vexa_token"]}`
                )
                .then(async (data) => {
                  const message =
                    data["initial_message"] ||
                    "Hi everyone, this is an automated message to let you know my Vexa extension: https://vexa.ai is transcribing this meeting for me so I can give my full attention to you."

                  const i = setInterval(async () => {
                    console.log("Trying to send")
                    // It was set from other source
                    if (document.body.classList.contains("chat-message-sent")) {
                      clearInterval(i)
                      return
                    }

                    // This part is not always works
                    if (true === (await chatManager.sendChatMessage(message))) {
                      document.body.classList.add("chat-message-sent")
                      clearInterval(i)
                    }
                  }, 1000)
                })
            }
          })
      })
    }
  }, [isCapturing])

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y })
  }

  const handleStop = (e: DraggableEvent, data: DraggableData) => {
    const { clientWidth, clientHeight } = document.documentElement
    const node = document.querySelector(".VexaDragHandle")
    const rect = node.getBoundingClientRect()
    if (
      rect.right < 10 ||
      rect.top > clientHeight - 20 ||
      rect.bottom < 20 ||
      rect.left > clientWidth - 20
    ) {
      setPosition(defaultPosition)
    }
  }

  const closeAlert = (e: MouseEvent | any) => {
    e.preventDefault()
    setOutdatedClosed(true)
  }

  useEffect(() => {
    asyncMessengerService
      .putRequest(`/api/v1/user-applications/check-version`, {
        app_version: chrome.runtime.getManifest()?.version
      })
      .then((data) => {
        if (false === data["is_actual"]) {
          setOutdated(true)
          setLatestVersion(data["actual_version"])
        }
      })
  }, [])

  useEffect(() => {
    if (isCapturing) {
      setHasRecorded(true)
      sendMessage(MessageType.HAS_RECORDING_HISTORY, {
        hasRecordingHistory: true
      })
    }
  }, [isCapturing])

  useEffect(() => {
    const handleResize = () => {
      if (isMaximized) {
        const { clientWidth, clientHeight } = document.documentElement
        const node = document.querySelector(".VexaDragHandle")
        if (node) {
          const rect = node.getBoundingClientRect()
          if (
            rect.right < 10 ||
            rect.top > clientHeight ||
            rect.bottom < 20 ||
            rect.left > clientWidth - 20
          ) {
            setPosition(defaultPosition)
          }
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isMaximized])

  const micPollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!isCapturing) {
      clearInterval(micPollingIntervalRef.current)

      return
    }

    let counter = 1
    let i = 0

    let nodes = []
    let callName
    let currentDate = null

    micPollingIntervalRef.current = setInterval(() => {
      // Re-read nodes every 5 seconds
      if (1 === counter % 50) {
        nodes = []

        callName = (
          document.querySelector(
            "[jscontroller=yEvoid]"
          ) as HTMLDivElement | null
        )?.innerText
        Array.from(document.querySelectorAll("[data-participant-id]")).map(
          (el: HTMLDivElement) => {
            const nameNode: HTMLDivElement =
              el.querySelector("[data-self-name]")
            const micNode: HTMLDivElement = el.querySelector(
              "[jscontroller=ES310d]"
            )
            if (!micNode || !nameNode) {
              return null
            }

            const name = nameNode.innerText?.split("\n").pop()
            nodes.push({
              id: el.dataset.participantId,
              name,
              el,
              micNode,
              mic: []
            })
          }
        )
      }

      nodes.forEach((node) => {
        if (node && node.micNode) {
          node.mic.push(node.micNode.classList.contains("gjg47c") ? 0 : 1)
        }
      })

      if (0 === counter++ % 10) {
        const ts = Math.floor((currentDate = new Date()).getTime() / 1000)
        asyncMessengerService.sendFetchRequestAndForget(
          "put",
          `/api/v1/extension/speakers?meeting_id=${MEETING_ID}&call_name=${callName}&ts=${ts}&l=1`,
          nodes.map((n) => [n.name, n.mic.join("")]),
          "stream",
          true
        )

        i++

        nodes.forEach((n) => (n.mic = []))
      }
    }, 100)

    return () => {
      clearInterval(micPollingIntervalRef.current)
    }
  }, [isCapturing])

  useEffect(() => {}, [isMaximized])
  /*
    let originalWidthGetter = Object.getOwnPropertyDescriptor(window, "innerWidth")?.get;
    window.__defineGetter__("innerWidth", function () {
        let s = originalWidthGetter && originalWidthGetter();
        console.log("innerWidth called", {s, isMaximized});
        return isMaximized ? s - 400 : s
    });
    document.documentElement?.__defineGetter__("clientWidth", function () {
        return window.innerWidth
    });
    document.body?.__defineGetter__("clientWidth", function () {
        return window.innerWidth
    })
    */

  return (
    <>
      {isMaximized && (
        <Draggable
          position={position}
          onDrag={handleDrag}
          onStop={handleStop}
          disabled={isDraggableDisabled}>
          <div
            id="vexa-content-div"
            className="flex flex-col w-[400px] min-h-[500px] top-0 left-0 bg-slate-950 m-4 p-4 rounded-lg overflow-y-auto overflow-x-hidden">
            <AudioCaptureContext.Provider value={audioCapture}>
              <NotificationContainer />
              <VexaToolbar
                onDragHandleMouseOut={() => setIsDraggableDisabled(true)}
                onDragHandleMouseUp={() => setIsDraggableDisabled(true)}
                onDragHandleMouseOver={() => setIsDraggableDisabled(false)}
                toolbarRef={vexaToolbarRef}
              />

              {outdated && !outdatedClosed && !isCapturing && (
                <div
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "5px 15px",
                    borderRadius: "3px",
                    marginBottom: "5px"
                  }}>
                  Your version ({chrome.runtime.getManifest()?.version}) is
                  outdated, please{" "}
                  <a
                    href={
                      "https://chromewebstore.google.com/detail/vexa/ihibgadfkbefnclpbhdlpahfiejhfibl?hl=en&authuser=0&utm_medium=extension&utm_source=update"
                    }
                    target={"_blank"}
                    style={{ color: "white", fontWeight: "bold" }}>
                    update extension
                  </a>{" "}
                  to the latest version.{" "}
                  <a
                    href="#"
                    onClick={closeAlert}
                    style={{ color: "white", fontWeight: "bold" }}>
                    Close
                  </a>
                </div>
              )}

              {isCapturing || hasRecorded ? (
                <>
                  {!isCapturing && <MicrophoneOptions />}
                  <MainContentView
                    className={hasRecorded ? "hasRecordingHistory" : ""}
                    onMouseOut={() => setIsDraggableDisabled(true)}
                  />
                </>
              ) : (
                <>
                  <MicrophoneOptions />
                  <VexaBuildInfo className="mx-auto mt-auto" />
                </>
              )}
              <SpeakerEditorModal />
              {/*<ThreadDeletePromptModal />*/}
            </AudioCaptureContext.Provider>
          </div>
        </Draggable>
      )}
    </>
  )
}

export default Vexa
