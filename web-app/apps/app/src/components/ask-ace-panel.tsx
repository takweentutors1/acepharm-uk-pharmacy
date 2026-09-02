'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  FileText, 
  Calculator, 
  AlertCircle, 
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@acepharm/ui';
import { Badge } from '@acepharm/ui';

interface Citation {
  id: string;
  sourceType: string;
  sourceId: string;
  label?: string;
}

interface AceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

interface AskAcePanelProps {
  questionId: string;
  questionPublicId?: string;
  isCalculation?: boolean;
  highlightedText?: string;
}

const QUICK_PROMPTS = [
  { id: 'simpler', label: 'Explain simpler', icon: Sparkles, prompt: 'Explain this clinical concept in simpler terms.' },
  { id: 'whynot', label: 'Why not other options?', icon: HelpCircle, prompt: 'Why are the other options incorrect or contraindicated in this scenario?' },
  { id: 'similar', label: 'Show similar case', icon: Layers, prompt: 'Can you describe a similar clinical scenario testing this objective?' },
  { id: 'test', label: 'Test my knowledge', icon: BookOpen, prompt: 'Test my understanding of this topic with a targeted follow-up question.' },
  { id: 'exam', label: 'GPhC exam traps', icon: AlertCircle, prompt: 'What are common GPhC examination traps or high-risk monitoring points for this topic?' },
];

export function AskAcePanel({ questionId, questionPublicId, isCalculation, highlightedText }: AskAcePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Trigger inquiry when text is highlighted and "Ask Ace about this" is clicked
  useEffect(() => {
    if (highlightedText && highlightedText.trim()) {
      setIsOpen(true);
      handleSendMessage(`Can you explain the following highlighted clinical excerpt:\n\n"${highlightedText.trim()}"`, 'free_text');
      // Scroll smoothly to Ask Ace panel
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [highlightedText]);

  // Auto-scroll when new messages appear
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle sending prompt
  const handleSendMessage = async (promptText: string, intent: string = 'free_text') => {
    if (!promptText.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: AceMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText.trim(),
      intent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    if (!isOpen) setIsOpen(true);

    const assistantMsgId = `ast-${Date.now()}`;
    // Add temporary loading/streaming message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      },
    ]);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';
      const res = await fetch(`${apiBase}/api/v1/ace/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          contextType: 'question',
          contextId: questionId,
          prompt: promptText.trim(),
          intent,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ace request failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      // Simulate streamed text reveal for smooth UX
      const fullText = data.content || 'I could not retrieve an answer for this query.';
      let displayedText = '';
      const chunkSize = Math.max(1, Math.floor(fullText.length / 15));
      let currentIdx = 0;

      const interval = setInterval(() => {
        currentIdx += chunkSize;
        displayedText = fullText.slice(0, currentIdx);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: displayedText,
                  citations: data.citations || [],
                  isStreaming: currentIdx < fullText.length,
                }
              : msg
          )
        );

        if (currentIdx >= fullText.length) {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 30);
    } catch (err: any) {
      console.error('Ask Ace error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'Ace is currently experiencing a connection delay. Please consult the verified clinical explanation and BNF guidance references provided in the explanation.',
                isStreaming: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleQuickPromptClick = (qp: (typeof QUICK_PROMPTS)[0]) => {
    handleSendMessage(qp.prompt, qp.id);
  };

  const promptOptions = isCalculation
    ? [
        { id: 'steps', label: 'Step-by-step breakdown', icon: Calculator, prompt: 'Break down the mathematical working step-by-step.' },
        ...QUICK_PROMPTS,
      ]
    : QUICK_PROMPTS;

  return (
    <div ref={panelRef} className="border border-indigo/30 bg-indigo/[0.02] rounded-card shadow-sm overflow-hidden transition-all duration-200">
      {/* 1. Header / Collapsed Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-indigo/[0.04] select-none border-b border-transparent group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo/10 flex items-center justify-center text-indigo">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                Ask Ace
                <Badge variant="info" className="text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider">
                  Grounded AI Tutor
                </Badge>
              </h3>
            </div>
            <p className="text-xs text-slate">
              Need clarity on this question? Ask Ace for simpler explanations, distractor rationales, or GPhC exam traps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate group-hover:text-ink text-xs flex items-center gap-1"
          >
            {isOpen ? 'Collapse' : 'Ask Ace'}
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* 2. Expanded Drawer */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-border bg-canvas/40 space-y-4">
          {/* Quick-Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Quick Explanations:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {promptOptions.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickPromptClick(qp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border/80 text-ink hover:border-indigo hover:text-indigo hover:bg-indigo/5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Stream & Chat History */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo text-white font-medium rounded-br-xs'
                        : 'bg-surface border border-border text-ink rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.content ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate py-1">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo" />
                        <span className="text-xs">Ace is reviewing clinical subtopic notes & guidance...</span>
                      </div>
                    )}

                    {/* Citations block for assistant responses */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-[11px] text-slate">
                        <span className="font-semibold text-slate">Grounded Sources:</span>
                        {msg.citations.map((cite, i) => (
                          <span
                            key={cite.id || i}
                            className="inline-flex items-center gap-1 bg-canvas border border-border px-2 py-0.5 rounded text-[10px] text-ink font-medium"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-indigo" />
                            {cite.sourceType === 'subtopic_note' ? 'NICE/BNF Subtopic Notes' : 'Question Explanation & Distractors'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Free Text Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Ace any clinical question about this vignette (e.g. 'Why is Indapamide chosen here?')..."
              disabled={isLoading}
              className="flex-1 bg-surface border border-border rounded-md px-3.5 py-2 text-xs text-ink placeholder:text-slate/60 focus:outline-none focus:ring-1 focus:ring-indigo focus:border-indigo transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center gap-1 text-xs px-3.5 py-2 shrink-0 font-semibold"
            >
              {isLoading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
