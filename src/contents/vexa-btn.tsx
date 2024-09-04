import { platform } from "os"
import globalCssText from "data-text:~global.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import React, { useEffect, useState, type MouseEventHandler } from "react"
import { createRoot } from "react-dom/client"
import Draggable, {
  type DraggableData,
  type DraggableEvent
} from "react-draggable"

import { VexaIcon } from "~shared/components/VexaLogo/VexaIcon"
import {
  getPlatform,
  Platform
} from "~shared/helpers/is-recordable-platform.helper"

import { StorageService, StoreKeys } from "../lib/services/storage.service"

const VexaBtn = () => {
  const [isMaximized, setIsMaximized] = StorageService.useHookStorage<boolean>(
    StoreKeys.WINDOW_STATE,
    true
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const platform = getPlatform()
  // const [isYoutubeEnabled] = StorageService.useHookStorage(StoreKeys.YOUTUBE_ENABLED, false);
  const defaultPosition = { x: 0, y: 0 }
  const [position, setPosition] = useState(defaultPosition)

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y })
    setIsDragging(true)
  }

  const handleStop = (e: DraggableEvent, data: DraggableData) => {
    const { clientWidth, clientHeight } = document.documentElement
    const { node } = data
    const rect = node.getBoundingClientRect()
    if (
      rect.right < 0 ||
      rect.top > clientHeight ||
      rect.bottom < 0 ||
      rect.left > clientWidth
    ) {
      setPosition(defaultPosition)
    }
  }

  const onClickHandler: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    if (event.type === "mousemove" || event.type === "touchmove") {
      return
    }

    if (event.type === "click" && isDragging) {
      setIsDragging(false)
      return
    }
    setIsMaximized(true)
  }

  useEffect(() => {
    const handleResize = () => {
      if (isMaximized) {
        const { clientWidth, clientHeight } = document.documentElement
        const node = document.getElementById("vexa-content-div")
        if (node) {
          const rect = node.getBoundingClientRect()
          if (
            rect.right < 0 ||
            rect.top > clientHeight ||
            rect.bottom < 0 ||
            rect.left > clientWidth
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

  useEffect(() => {
    setTimeout(() => {
      setIsReady(true)
    }, 500)
  }, [])

  return (
    <>
      {
        // (platform === Platform.YOUTUBE && isYoutubeEnabled || platform === Platform.MEET) && isReady && !isMaximized && (
        platform === Platform.MEET && isReady && !isMaximized && (
          <div
            onMouseOver={() => setIsDragging(false)}
            onMouseOut={() => setIsDragging(false)}>
            <Draggable
              position={position}
              onDrag={handleDrag}
              onStop={handleStop}>
              <button
                onClick={onClickHandler}
                className="fixed right-4 top-1/2 -translate-y-1/2 rounded-full size-12 p-4 flex items-center justify-center bg-card shadow-md">
                <VexaIcon strokeColor="white" />
              </button>
            </Draggable>
          </div>
        )
      }
    </>
  )
}

export default VexaBtn

export const config: PlasmoCSConfig = {
  matches: ["*://meet.google.com/*"]
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => document.body

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
        ${globalCssText}
    `
  return style
}
