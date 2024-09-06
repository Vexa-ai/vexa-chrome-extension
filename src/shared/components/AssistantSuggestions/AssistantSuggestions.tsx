import React, { useRef, useState } from "react"

import "./AssistantSuggestions.scss"

import { Button } from "~components/ui/Button"
import type { ActionButton } from "~shared/components/TranscriptList"

export interface AssistantSuggestionsProps {
  suggestions?: ActionButton[]
  selectSuggestion: (suggestion: ActionButton) => void
}

export function AssistantSuggestions({
  suggestions = [],
  selectSuggestion
}: AssistantSuggestionsProps) {
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [startX, setStartX] = useState<number>(0)
  const [scrollLeft, setScrollLeft] = useState<number>(0)
  const [dragged, setDragged] = useState<boolean>(false)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setStartX(e.pageX - suggestionsRef.current!.offsetLeft)
    setScrollLeft(suggestionsRef.current!.scrollLeft)
    setDragged(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const x = e.pageX - suggestionsRef.current!.offsetLeft
    const walk = x - startX
    if (Math.abs(walk) > 5) {
      setDragged(true)
    }
    suggestionsRef.current!.scrollLeft = scrollLeft - walk
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX - suggestionsRef.current!.offsetLeft)
    setScrollLeft(suggestionsRef.current!.scrollLeft)
    setDragged(false)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const x = e.touches[0].pageX - suggestionsRef.current!.offsetLeft
    const walk = x - startX
    if (Math.abs(walk) > 5) {
      setDragged(true)
    }
    suggestionsRef.current!.scrollLeft = scrollLeft - walk
  }

  const handleClick = (suggestion: ActionButton) => {
    if (!dragged) {
      selectSuggestion({ ...suggestion } as ActionButton)
    }
  }

  return (
    <div className="bottom AssistantSuggestions px-4 py-2">
      {suggestions.map((suggestion, key) => (
        <Button
          key={key}
          onClick={() => handleClick(suggestion)}
          type="button"
          variant="ghost"
          className="text-primary">
          {suggestion.name}
        </Button>
      ))}
    </div>
  )
}
