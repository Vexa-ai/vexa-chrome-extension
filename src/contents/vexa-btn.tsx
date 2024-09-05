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
      {platform === Platform.MEET && isReady && !isMaximized && (
        <div
          onMouseOver={() => setIsDragging(false)}
          onMouseOut={() => setIsDragging(false)}>
          <Draggable
            position={position}
            onDrag={handleDrag}
            onStop={handleStop}>
            <div className="fixed dark right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-16 h-2 bg-handle shadow-md absolute top-0 right-0 -rotate-[30deg] z-10 rounded-sm"></div>
              <button
                onClick={onClickHandler}
                className="vinyl-disk w-full h-full rounded-full p-8 flex items-center justify-center bg-secondary shadow-xl">
                <div className="vinyl-label flex items-center justify-center p-2 bg-card rounded-full">
                  <VexaIcon strokeColor="white" />
                </div>
              </button>
            </div>
          </Draggable>
        </div>
      )}
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
        .vinyl-disk {
          background: 
            repeating-radial-gradient(circle at center, 
              #000000 0, 
              #000000 2px, 
              #555 3px, 
              #555 4px
            ),
            radial-gradient(circle, #000000 0%, #555 70%, #000000 100%);
          animation: rotate 5s linear infinite;
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .bg-handle {
          background: radial-gradient(circle, #d4d4d4 0%, #a0a0a0 100%);
        }
    `
  return style
}
