import { platform } from "os"
import globalCssText from "data-text:~global.css"
import { motion } from "framer-motion"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import React, { useEffect, useState, type MouseEventHandler } from "react"
import { createRoot } from "react-dom/client"
import Draggable, {
  type DraggableData,
  type DraggableEvent
} from "react-draggable"

import { VexaIcon } from "~shared/components/VexaIcon"
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
  const [isCapturing, setIsCapturing] = useState(false)

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

  useEffect(() => {
    const checkCaptureStatus = async () => {
      const capturingState = await StorageService.get(
        StoreKeys.CAPTURING_STATE,
        false
      )
      setIsCapturing(capturingState)
    }

    checkCaptureStatus()
    const interval = setInterval(checkCaptureStatus, 1000)

    return () => clearInterval(interval)
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
            <motion.div
              className="fixed dark right-4 top-1/2 group -translate-y-1/2 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}>
              <div
                className={`w-2 h-2  absolute rounded-full top-0 right-0 ${isCapturing ? "bg-red-500" : "bg-neutral-300"}`}></div>
              <div className="w-12 h-1.5 bg-handle shadow-md absolute -bottom-3 right-0 rotate-[72deg] group-hover:rotate-[90deg] z-10 rounded-sm origin-right transition-all duration-300 ease-in-out"></div>
              <motion.button
                onClick={onClickHandler}
                className={`vinyl-disk w-full h-full rounded-full p-4 flex items-center justify-center bg-secondary shadow-xl ${isCapturing ? "spinning" : ""}`}
                whileTap={{ scale: 0.95 }}>
                <div className="vinyl-label flex items-center justify-center p-1 bg-card rounded-full">
                  <VexaIcon strokeColor="white" size="20" />
                </div>
              </motion.button>
            </motion.div>
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
        }
        .vinyl-disk.spinning {
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
