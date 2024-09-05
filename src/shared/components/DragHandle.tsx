import React, { type MutableRefObject } from "react"

export interface VexaDragHandleProps {
  dragHandleRef?: MutableRefObject<any>
  onHandleMouseOut: () => void
  onHandleMouseUp: () => void
  onHandleMouseOver: () => void
  [key: string]: any
}

export function DragHandle({
  className = "",
  onHandleMouseOut = () => {},
  onHandleMouseUp = () => {},
  onHandleMouseOver = () => {}
}: VexaDragHandleProps) {
  return (
    <div
      onMouseOut={onHandleMouseOut}
      onMouseUp={onHandleMouseUp}
      onMouseOver={onHandleMouseOver}
      className={`VexaDragHandle ${className}`}>
      <svg
        width="10"
        height="16"
        viewBox="0 0 10 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.00001 3.00001C8.46025 3.00001 8.83334 2.62691 8.83334 2.16668C8.83334 1.70644 8.46025 1.33334 8.00001 1.33334C7.53977 1.33334 7.16668 1.70644 7.16668 2.16668C7.16668 2.62691 7.53977 3.00001 8.00001 3.00001Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.00001 8.83334C8.46025 8.83334 8.83334 8.46025 8.83334 8.00001C8.83334 7.53977 8.46025 7.16668 8.00001 7.16668C7.53977 7.16668 7.16668 7.53977 7.16668 8.00001C7.16668 8.46025 7.53977 8.83334 8.00001 8.83334Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.00001 14.6667C8.46025 14.6667 8.83334 14.2936 8.83334 13.8333C8.83334 13.3731 8.46025 13 8.00001 13C7.53977 13 7.16668 13.3731 7.16668 13.8333C7.16668 14.2936 7.53977 14.6667 8.00001 14.6667Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.16668 3.00001C2.62691 3.00001 3.00001 2.62691 3.00001 2.16668C3.00001 1.70644 2.62691 1.33334 2.16668 1.33334C1.70644 1.33334 1.33334 1.70644 1.33334 2.16668C1.33334 2.62691 1.70644 3.00001 2.16668 3.00001Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.16668 8.83334C2.62691 8.83334 3.00001 8.46025 3.00001 8.00001C3.00001 7.53977 2.62691 7.16668 2.16668 7.16668C1.70644 7.16668 1.33334 7.53977 1.33334 8.00001C1.33334 8.46025 1.70644 8.83334 2.16668 8.83334Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.16668 14.6667C2.62691 14.6667 3.00001 14.2936 3.00001 13.8333C3.00001 13.3731 2.62691 13 2.16668 13C1.70644 13 1.33334 13.3731 1.33334 13.8333C1.33334 14.2936 1.70644 14.6667 2.16668 14.6667Z"
          stroke="#94969C"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
