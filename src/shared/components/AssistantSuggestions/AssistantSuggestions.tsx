import React, {useRef, useState} from 'react';

import './AssistantSuggestions.scss';
import type {ActionButton} from "~shared/components/TranscriptList";

export interface AssistantSuggestionsProps {
  suggestions?: ActionButton[];
  selectSuggestion: (suggestion: ActionButton) => void;
}

export function AssistantSuggestions({suggestions = [], selectSuggestion}: AssistantSuggestionsProps) {
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [dragged, setDragged] = useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - suggestionsRef.current!.offsetLeft);
    setScrollLeft(suggestionsRef.current!.scrollLeft);
    setDragged(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.pageX - suggestionsRef.current!.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    suggestionsRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - suggestionsRef.current!.offsetLeft);
    setScrollLeft(suggestionsRef.current!.scrollLeft);
    setDragged(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - suggestionsRef.current!.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    suggestionsRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleClick = (suggestion: ActionButton) => {
    if (!dragged) {
      selectSuggestion({...suggestion} as ActionButton);
    }
  };

  return (
    <div className={"bottom"}>
      {suggestions.map((suggestion, key) => (
          <button
            key={key}
            onClick={() => handleClick(suggestion)}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded text-xs px-2.5 py-2 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            {suggestion.name}
          </button>
        )
      )}
    </div>
  );
}
