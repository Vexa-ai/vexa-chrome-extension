import closeIcon from "data-base64:~assets/images/svg/x-close.svg"
import React, { useEffect, useState } from "react"

import {
  MessageListenerService,
  MessageType
} from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import { onMessage } from "~shared/helpers/in-content-messaging.helper"

import { BouncingDots } from "./BouncingDots"
import type { Option } from "./CustomSelect"
import { EditPenButton } from "./EditPenButton"

export interface ThreadDeletePromptModalProps {
  // thread: Thread;
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
    <div className="ThreadDeletePromptModal z-[100]">
      {showEditorModal && (
        <div>
          <div className="ModalBackdrop top-0 left-0 fixed h-full w-full backdrop-blur">
            <div className="w-full h-full flex items-center justify-center">
              <div className="ModalUi mx-3 p-4 rounded-lg w-full bg-[#0C111D]">
                <div className="flex items-start bg-transparent">
                  <button className="border-[1.5px] border-[#F04438] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white h-12 w-12">
                    <svg
                      className="w-[24px] h-[24px]"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M7.5 2.5H12.5M2.5 5H17.5M15.8333 5L15.2489 13.7661C15.1612 15.0813 15.1174 15.7389 14.8333 16.2375C14.5833 16.6765 14.206 17.0294 13.7514 17.2497C13.235 17.5 12.5759 17.5 11.2578 17.5H8.74221C7.42409 17.5 6.76503 17.5 6.24861 17.2497C5.79396 17.0294 5.41674 16.6765 5.16665 16.2375C4.88259 15.7389 4.83875 15.0813 4.75107 13.7661L4.16667 5M8.33333 8.75V12.9167M11.6667 8.75V12.9167"
                        stroke="#F04438"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-transparent ml-auto">
                    <img src={closeIcon} alt="Close modal" />
                  </button>
                </div>
                <p className="font-semibold text-lg text-[#F5F5F6] mb-5 mt-3">
                  Are you sure you want to delete thread{" "}
                  <span className="font-normal">
                    "{threadData.label.substring(0, 50)}"
                  </span>
                  ?
                </p>
                {/* <div className="flex flex-col gap-2 mb-6">
                  <label htmlFor="name" className='text-[#CECFD2]'>Name</label>
                  <input
                    value={speakerData.speaker || ''}
                    onChange={handleInputChange}
                    type="text"
                    placeholder='Update speaker name'
                    className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2 text-white"
                    name='name'
                  />
                </div> */}
                <div className="flex flex-col w-full gap-2">
                  <button
                    onClick={() => deleteThread(threadData)}
                    className="w-full p-2 rounded-md disabled:bg-[#1F242F] bg-[#F04438] disabled:text-[#85888E] text-white text-center font-semibold text-base">
                    {isDeletingThread ? (
                      <BouncingDots className="py-[10px]" />
                    ) : (
                      "Delete Thread"
                    )}
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full p-2 rounded-md border border-[#333741] disabled:bg-[#1F242F] bg-[#161B26] text-[#CECFD2] text-center font-semibold text-base">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
