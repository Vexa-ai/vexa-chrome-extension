import React, { useRef, useState } from 'react';

import './AssistantSuggestions.scss';

export interface AssistantSuggestionsProps {
  suggestions?: string[];
  selectSuggestion: (index: number) => void;
}

export function AssistantSuggestions({ suggestions = [], selectSuggestion }: AssistantSuggestionsProps) {

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - suggestionsRef.current!.offsetLeft);
    setScrollLeft(suggestionsRef.current!.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.pageX - suggestionsRef.current!.offsetLeft;
    const walk = x - startX;
    suggestionsRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - suggestionsRef.current!.offsetLeft);
    setScrollLeft(suggestionsRef.current!.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - suggestionsRef.current!.offsetLeft;
    const walk = x - startX;
    suggestionsRef.current!.scrollLeft = scrollLeft - walk;
  };

  return <div className='AssistantSuggestions flex w-full overflow-x-hidden' ref={suggestionsRef}
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseUp}
    onMouseMove={handleMouseMove}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    onTouchMove={handleTouchMove}>
    <div className='flex gap-2 min-w-[180%] overflow-x-auto mb-2'>
      {suggestions.map((suggestion, key) => <div onClick={() => selectSuggestion(key)} className={`suggestion select-none p-1 w-[66.66%] border border-[#333741] rounded font-medium text-[#F5F5F6] ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} ${key == suggestions.length ? 'mr-7' : ''}`} key={key}>
        {suggestion}
      </div>)}
    </div>

  </div>;
}
