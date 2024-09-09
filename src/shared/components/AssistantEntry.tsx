import { motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"

import "@mdxeditor/editor/style.css"

import { Check, X } from "lucide-react"
import Markdown from "markdown-to-jsx"

import { MessageType } from "~lib/services/message-listener.service"
import {
  onMessage,
  sendMessage
} from "~shared/helpers/in-content-messaging.helper"

import { type ThreadMessage } from "./AssistantList"
import { CopyButton } from "./CopyButton"
import { EditPenButton } from "./EditPenButton"

export interface AssistantEntryProps {
  entryData: ThreadMessage
  onTextUpdated?: (updatedEntry: ThreadMessage) => void
  pending?: boolean
}

export function AssistantEntry({
  entryData,
  onTextUpdated,
  pending
}: AssistantEntryProps) {
  const editorRef = useRef<HTMLTextAreaElement>()
  const [entry, setEntry] = useState<ThreadMessage>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, setIsPending] = useState(pending)
  const [isCopied, setIsCopied] = useState(false)

  const copyText = () => {
    navigator.clipboard.writeText(entryData.label).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const showEditor = () => {
    sendMessage(MessageType.ASSISTANT_ENTRY_EDIT_STARTED, entry)
    setIsEditing(true)
  }

  const hideEditor = () => {
    setIsEditing(false)
  }

  const handleTextUpdate = () => {
    entry.text = entry.text.trim()
    onTextUpdated?.(entry)
    hideEditor()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEntry(entry.cloneWithText(e.target.value))
  }

  useEffect(() => {
    setIsPending(pending)
  }, [pending])

  useEffect(() => {
    setEntry(entryData)
    const onEntryEditClickCleanup = onMessage(
      MessageType.ASSISTANT_ENTRY_EDIT_STARTED,
      (entryToEdit: ThreadMessage) => {
        console.log({ entryToEdit })
        // if (entryToEdit.)
      }
    )

    return onEntryEditClickCleanup
  }, [])

  return (
    <div className="px-4">
      {entry ? (
        <motion.div
          className="my-1"
          // initial={{ y: -20, opacity: 0 }}
          // animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}>
          <div className="flex flex-col p-1 relative group">
            <span className="sticky top-2 z-10 group-hover:block hidden">
              <span className="absolute top-0 right-0 flex gap-1 items-center">
                {entry.role === "user" &&
                  (isEditing ? (
                    <button
                      onClick={handleTextUpdate}
                      disabled={!entry.label?.trim()}
                      className="bg-background border p-1 flex gap-1 items-center justify-center rounded-lg font-medium text-primary">
                      <Check className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ) : (
                    <p className="bg-background border p-1 flex gap-1 items-center justify-center rounded-lg font-medium text-primary">
                      <EditPenButton
                        svgClassName="w-[14px] h-[15.4px]"
                        onClick={showEditor}
                      />
                    </p>
                  ))}

                {isEditing ? (
                  <button
                    onClick={hideEditor}
                    className="bg-background border p-1 flex gap-1 items-center justify-center rounded-lg font-medium text-primary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                ) : (
                  <CopyButton onCopy={copyText} />
                )}
              </span>
            </span>
            <div className="flex gap-2 mb-1 break-words items-center">
              <span className="font-medium text-primary select-text break-words">
                {entry.role === "user" ? "You" : "Vexa"}
              </span>
            </div>
            <div className="select-text break-words">
              {isEditing ? (
                <textarea
                  ref={editorRef}
                  onChange={handleInputChange}
                  value={entry.label}
                  className="w-full text-primary rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  name="editor"
                  id="editor"
                  cols={5}></textarea>
              ) : (
                <div className="markdown text-sm text-primary/90">
                  <Markdown
                    options={{
                      overrides: {
                        a: {
                          props: {
                            target: "_blank"
                          }
                        }
                      }
                    }}>
                    {entry.label?.trim()}
                  </Markdown>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
