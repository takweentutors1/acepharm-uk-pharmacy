'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingHighlightMenuProps {
  onAskAce: (selectedText: string) => void;
  containerRef?: React.RefObject<HTMLElement>;
}

export function FloatingHighlightMenu({ onAskAce, containerRef }: FloatingHighlightMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition(null);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    // Only trigger on selections longer than 3 characters
    if (text.length < 3) {
      setPosition(null);
      setSelectedText('');
      return;
    }

    // Ensure selection is inside the container if specified
    if (containerRef && containerRef.current) {
      const anchorNode = selection.anchorNode;
      if (anchorNode && !containerRef.current.contains(anchorNode)) {
        setPosition(null);
        setSelectedText('');
        return;
      }
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position floating badge centered right above selection
      const top = rect.top + window.scrollY - 44;
      const left = rect.left + window.scrollX + rect.width / 2;

      setPosition({ top: Math.max(10, top), left: Math.max(20, left) });
      setSelectedText(text);
    } catch {
      setPosition(null);
      setSelectedText('');
    }
  }, [containerRef]);

  useEffect(() => {
    // Listen for both desktop mouseup/selectionchange and mobile touchend/selectionchange
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
      className="animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        type="button"
        onMouseDown={(e) => {
          // Prevent losing selection on click
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onAskAce(selectedText);
          setPosition(null);
          // Clear selection
          window.getSelection()?.removeAllRanges();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo text-white text-xs font-bold shadow-lg hover:bg-indigo/90 active:scale-95 transition-all border border-white/20 whitespace-nowrap cursor-pointer touch-manipulation"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ask Ace about this</span>
      </button>
    </div>
  );
}
