import vexaSendButton from "data-base64:~assets/images/svg/send.svg"
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react"

import AsyncMessengerService from "~lib/services/async-messenger.service"
import {
  MessageListenerService,
  MessageType
} from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import {
  StorageService,
  StoreKeys,
  type AuthorizationData
} from "~lib/services/storage.service"
import {
  AssistantSuggestions,
  TranscriptionCopyButton
} from "~shared/components"
import { sendMessage } from "~shared/helpers/in-content-messaging.helper"
import { getIdFromUrl } from "~shared/helpers/meeting.helper"

import { BouncingDots } from "./BouncingDots"
import {
  TranscriptEntry,
  TranscriptionEntry,
  TranscriptionEntryMode,
  type TranscriptionEntryData
} from "./TranscriptEntry"

const MEETING_ID = getIdFromUrl(window.location.href)
const asyncMessengerService = new AsyncMessengerService()

export interface ActionButtonsResponse {
  total: number
  buttons?: ActionButton[]
}

export interface ActionButton {
  name: string
  type: string
  prompt: string
}

export interface TranscriptListProps {
  className?: string
  transcriptList?: TranscriptionEntryData[]
  updatedTranscriptList?: (transcriptList: TranscriptionEntryData[]) => void
  onActionButtonClicked?: (ab: ActionButton) => void
  onAssistantRequest?: (message: string) => void
}

export function TranscriptList({
  transcriptList = [],
  updatedTranscriptList = (transcriptList) => {
    console.log({ transcriptList })
  },
  className = "",
  onActionButtonClicked = (ab: ActionButton) => {},
  onAssistantRequest = (message: string) => {}
}: TranscriptListProps) {
  const [transcripts, setTranscripts] = useState<
    TranscriptionEntryData[] | TranscriptionEntry[]
  >([])
  // const [transcriptMode, setTranscriptMode] = useState<TranscriptionEntryMode>(TranscriptionEntryMode.HtmlContentShort);
  const [lastTranscriptTimestamp, setLastTranscriptTimestamp] =
    useState<Date | null>()
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [scrolledToTop, setScrolledToTop] = useState(true)
  const [actionButtons, setActionButtons] = useState<ActionButton[]>()
  const [isCapturing] = StorageService.useHookStorage<boolean>(
    StoreKeys.CAPTURING_STATE
  )
  const [transcriptMode] =
    StorageService.useHookStorage<TranscriptionEntryMode>(
      StoreKeys.TRANSCRIPT_MODE,
      TranscriptionEntryMode.HtmlContent
    )
  const [isShortTranscript, setIsShortTranscript] = useState<boolean>(false)

  const [userMessage, setUserMessage] = useState<string>("")

  const transcriptListRef = useRef<HTMLDivElement>(null)
  const copyTranscriptionRef = useRef<HTMLButtonElement>(null)
  const lastEntryRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptsRef = useRef<TranscriptionEntryData[]>()
  const userMessageInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    transcriptsRef.current = transcripts
  }, [transcripts])

  /*
  useEffect(() => {
    console.log({transcriptMode});
    StorageService.set(StoreKeys.TRANSCRIPT_MODE, transcriptMode);
  }, [transcriptMode])
  */

  const lastTranscriptTimestampRef = useRef<Date | null>(null)
  useEffect(() => {
    lastTranscriptTimestampRef.current = lastTranscriptTimestamp
  }, [lastTranscriptTimestamp])

  const messageSender = new MessageSenderService()
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      setIsAutoScroll(scrollTop + clientHeight >= scrollHeight - 10)
      setScrolledToTop(scrollTop === 0)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {}, 150)
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener("scroll", handleScroll)
    }
    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener("scroll", handleScroll)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [scrollAreaRef])

  /*
  MessageListenerService.unRegisterMessageListener(MessageType.TRANSCRIPTION_RESULT);
  MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_RESULT, (message) => {
    const transcription: TranscriptionEntryData[] = message.data?.transcripts || [];
    if (transcription && transcription.length) {
      const previousTranscripts = [...transcripts];
      const cursorIndex = previousTranscripts.findLastIndex(prevTranscript => prevTranscript.timestamp === transcription[0].timestamp);
      setTranscripts([...previousTranscripts.splice(0, cursorIndex), ...transcription]);
    }
  });
  */

  const copyTranscription = async () => {
    const authData = await StorageService.get<AuthorizationData>(
      StoreKeys.AUTHORIZATION_DATA
    )
    const transcriptionURL = `/api/v1/transcription?meeting_id=${MEETING_ID}&token=${authData.__vexa_token}${lastTranscriptTimestampRef.current ? "&last_msg_timestamp=" + lastTranscriptTimestampRef.current.toISOString() : ""}`
    return asyncMessengerService
      .getRequest(transcriptionURL)
      .then(async (response: TranscriptionEntryData[]) => {
        const mergedTranscripts = response
          .map((transcript) => {
            return `${transcript.speaker}: ${transcript.content}`
          })
          .join("\n")

        navigator.clipboard.writeText(mergedTranscripts)

        copyTranscriptionRef.current.innerText = "copied ✓"
        setTimeout(() => {
          copyTranscriptionRef.current.innerText = "Copy transcription"
        }, 2000)
      })
  }

  // Polling transcription
  useEffect(() => {
    const MEETING_ID = getIdFromUrl(window.location.href)
    let counter = 0
    let interval = setInterval(async () => {
      if (0 === counter++ % 50) {
        // reload whole history every X cycles
        lastTranscriptTimestampRef.current = null
      }

      const authData = await StorageService.get<AuthorizationData>(
        StoreKeys.AUTHORIZATION_DATA
      )
      const transcriptionURL = `/api/v1/transcription?meeting_id=${MEETING_ID}&token=${authData.__vexa_token}${lastTranscriptTimestampRef.current ? "&last_msg_timestamp=" + lastTranscriptTimestampRef.current.toISOString() : ""}`
      asyncMessengerService
        .getRequest(transcriptionURL)
        .then(async (response: TranscriptionEntryData[]) => {
          response = response.map((entry) => new TranscriptionEntry(entry))

          console.log({ response })

          if (response && response.length) {
            const dateBackBy5Minute = new Date(
              response[response.length - 1].timestamp
            )
            dateBackBy5Minute.setMinutes(dateBackBy5Minute.getMinutes() - 5)
            setLastTranscriptTimestamp(dateBackBy5Minute)

            const previousTranscripts = [...transcriptsRef.current]
            const cursorIndex = previousTranscripts.findLastIndex(
              (prevTranscript) =>
                prevTranscript.timestamp === response[0].timestamp
            )

            console.log({ cursorIndex })
            setTranscripts([
              ...previousTranscripts.splice(0, cursorIndex),
              ...response
            ])
          }
        })
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const fetchActionButtons = function () {
    asyncMessengerService
      .getRequest(`/api/v1/assistant/buttons?meeting_id=${MEETING_ID}`)
      .then((response: ActionButtonsResponse) => {
        setActionButtons(response.buttons)
      })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActionButtons()
    }, 10000)

    fetchActionButtons()

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isAutoScroll && lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: "smooth" })
    }
    sendMessage(MessageType.HAS_RECORDING_HISTORY, {
      hasRecordingHistory: true
    })
    updatedTranscriptList(transcripts)
  }, [transcripts])

  useEffect(() => {
    setTranscripts(transcriptList)

    MessageListenerService.unRegisterMessageListener(
      MessageType.UPDATE_SPEAKER_NAME_RESULT
    )
    MessageListenerService.registerMessageListener(
      MessageType.UPDATE_SPEAKER_NAME_RESULT,
      (message) => {
        sendMessage(MessageType.SPEAKER_EDIT_COMPLETE, message)
      }
    )
    return () => {
      MessageListenerService.unRegisterMessageListener(
        MessageType.UPDATE_SPEAKER_NAME_RESULT
      )
      MessageListenerService.unRegisterMessageListener(
        MessageType.TRANSCRIPTION_RESULT
      )
    }
  }, [])

  /*
  useEffect(() => {
    StorageService.set(StoreKeys.TRANSCRIPT_MODE, isShortTranscript ? TranscriptionEntryMode.HtmlContentShort : TranscriptionEntryMode.HtmlContent)
  }, [isShortTranscript]);
  */

  const sendUserMessage = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      let content = userMessage?.trim()
      if (content?.length === 0) {
        return
      }

      onAssistantRequest(content)
      setUserMessage("")
    },
    [userMessage]
  )

  const clickedInsideTranscriptList = (e) => {
    if ((e.target as HTMLElement).tagName === "B") {
      onAssistantRequest(e.target.innerText)
    }
  }

  return (
    <div
      ref={transcriptListRef}
      className={`TranscriptList flex flex-col max-h-full w-full h-full overflow-hidden group/transcript-container ${className}`}
      onClick={clickedInsideTranscriptList}>
      <div className="shortToggle w-full py-1 border-b border-white">
        <button
          onClick={copyTranscription}
          ref={copyTranscriptionRef}
          style={{ color: "white" }}>
          Copy transcription
        </button>
        {/*
        <label className="inline-flex items-center cursor-pointer float-end">
          <input type="checkbox" checked={!!isShortTranscript} onChange={e => setIsShortTranscript(e.target.checked)} className="sr-only peer"/>
          <div
            title={"This is experimental mode. Please let us know if something does not work for you."}
            className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <span className="text-white float-end pr-4">Show short</span>
        */}
      </div>

      <div ref={scrollAreaRef} className="flex-grow overflow-y-auto">
        {/*
        {transcripts.length > 0 && <div className={`mr-2 ${scrolledToTop ? '' : 'hidden'} group-hover/transcript-container:flex mt-2 sticky top-1 z-50 w-[fit-content]`}>
          <TranscriptionCopyButton className='rounded-lg' onCopyTranscriptClicked={copyTranscription}/>
        </div>}
        */}

        {transcripts.map((transcript: TranscriptionEntry, index: number) => (
          <div
            key={index}
            ref={transcripts.length - 1 === index ? lastEntryRef : null}
            className="TranscriptEntry inline mr-1.5">
            <TranscriptEntry
              entry={transcript}
              globalMode={transcriptMode}
              speaker_id={transcript.speaker_id}
              timestamp={transcript.timestamp}
              text={transcript.content}
              speaker={transcript.speaker}
            />
          </div>
        ))}

        {isCapturing && (
          <div className="flex flex-grow-0 p-3 mt-1 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26]">
            <BouncingDots />
          </div>
        )}
      </div>
      <AssistantSuggestions
        suggestions={actionButtons}
        selectSuggestion={onActionButtonClicked}
      />

      <div
        className={`AssistantInput mt-auto bg-slate-950 pb-2 pl-1`}
        style={{ marginTop: "3px" }}>
        <form
          autoComplete="off"
          onSubmit={sendUserMessage}
          className="flex gap-1">
          <textarea
            ref={userMessageInputRef}
            value={userMessage}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) sendUserMessage(e)
            }}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Start typing..."
            className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2"
            style={{
              color: "white",
              resize: "none",
              maxHeight: "180px",
              minHeight: "39px"
            }}
            name="assistant-input"
          />

          <button disabled={userMessage?.trim()?.length === 0} type="submit">
            <img src={vexaSendButton} alt="" />
          </button>
        </form>
      </div>
    </div>
  )
}
