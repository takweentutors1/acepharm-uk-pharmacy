'use client';

import React, { useState } from 'react';
import { Card, Button } from '@acepharm/ui';
import { Calculator, X, Delete } from 'lucide-react';

interface GphcCalculatorProps {
  onClose?: () => void;
}

export const GphcCalculator: React.FC<GphcCalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewInput, setWaitingForNewInput] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  const handleDigit = (digit: string) => {
    if (waitingForNewInput || display === '0') {
      setDisplay(digit);
      setWaitingForNewInput(false);
    } else {
      if (display.length < 12) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (waitingForNewInput) {
      setDisplay('0.');
      setWaitingForNewInput(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewInput(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOperation = (nextOp: string) => {
    const current = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(current);
    } else if (operation) {
      const result = calculate(prevValue, current, operation);
      setPrevValue(result);
      setDisplay(String(result));
    }

    setWaitingForNewInput(true);
    setOperation(nextOp);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevValue === null || !operation) return;
    const current = parseFloat(display);
    const result = calculate(prevValue, current, operation);
    // Format precision to avoid float point noise (e.g. 0.0000001)
    const formatted = parseFloat(result.toPrecision(10));
    setDisplay(String(formatted));
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewInput(true);
  };

  // Memory functions
  const handleMemoryRecall = () => {
    setDisplay(String(memory));
    setWaitingForNewInput(true);
  };

  const handleMemoryAdd = () => {
    setMemory(memory + parseFloat(display));
    setWaitingForNewInput(true);
  };

  const handleMemorySubtract = () => {
    setMemory(memory - parseFloat(display));
    setWaitingForNewInput(true);
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  const handleSquareRoot = () => {
    const val = parseFloat(display);
    if (val >= 0) {
      setDisplay(String(parseFloat(Math.sqrt(val).toPrecision(10))));
      setWaitingForNewInput(true);
    }
  };

  return (
    <div className="w-72 bg-surface border-2 border-indigo/40 rounded-card shadow-modal p-4 font-sans text-ink select-none animate-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <Calculator className="w-4 h-4 text-indigo" />
          <span>GPhC Exam Calculator</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate hover:text-ink p-1 rounded-btn transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Screen */}
      <div className="bg-canvas border border-border rounded-btn p-3 mb-3 text-right overflow-hidden shadow-inner">
        <div className="text-[10px] text-slate font-mono h-4">
          {memory !== 0 ? 'M' : ''} {prevValue !== null && operation ? `${prevValue} ${operation}` : ''}
        </div>
        <div className="text-2xl font-bold font-mono text-ink tracking-wider truncate">
          {display}
        </div>
      </div>

      {/* Memory Row */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        <button type="button" onClick={handleMemoryClear} className="py-1.5 text-[11px] font-bold rounded-btn bg-surface border border-border text-slate hover:border-indigo hover:text-ink transition-colors">MC</button>
        <button type="button" onClick={handleMemoryRecall} className="py-1.5 text-[11px] font-bold rounded-btn bg-surface border border-border text-slate hover:border-indigo hover:text-ink transition-colors">MR</button>
        <button type="button" onClick={handleMemorySubtract} className="py-1.5 text-[11px] font-bold rounded-btn bg-surface border border-border text-slate hover:border-indigo hover:text-ink transition-colors">M-</button>
        <button type="button" onClick={handleMemoryAdd} className="py-1.5 text-[11px] font-bold rounded-btn bg-surface border border-border text-slate hover:border-indigo hover:text-ink transition-colors">M+</button>
      </div>

      {/* Main Keypad */}
      <div className="grid grid-cols-4 gap-1.5 text-sm font-semibold">
        <button type="button" onClick={handleClear} className="py-2.5 rounded-btn bg-danger-wash text-danger border border-danger-border hover:bg-danger/20 transition-colors">C</button>
        <button type="button" onClick={handleBackspace} className="py-2.5 rounded-btn bg-surface border border-border text-slate hover:text-ink flex items-center justify-center transition-colors"><Delete className="w-4 h-4" /></button>
        <button type="button" onClick={handleSquareRoot} className="py-2.5 rounded-btn bg-surface border border-border text-slate hover:text-ink transition-colors">√</button>
        <button type="button" onClick={() => handleOperation('÷')} className="py-2.5 rounded-btn bg-indigo-wash text-indigo border border-indigo-200 hover:bg-indigo hover:text-white transition-colors">÷</button>

        <button type="button" onClick={() => handleDigit('7')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">7</button>
        <button type="button" onClick={() => handleDigit('8')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">8</button>
        <button type="button" onClick={() => handleDigit('9')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">9</button>
        <button type="button" onClick={() => handleOperation('×')} className="py-2.5 rounded-btn bg-indigo-wash text-indigo border border-indigo-200 hover:bg-indigo hover:text-white transition-colors">×</button>

        <button type="button" onClick={() => handleDigit('4')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">4</button>
        <button type="button" onClick={() => handleDigit('5')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">5</button>
        <button type="button" onClick={() => handleDigit('6')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">6</button>
        <button type="button" onClick={() => handleOperation('-')} className="py-2.5 rounded-btn bg-indigo-wash text-indigo border border-indigo-200 hover:bg-indigo hover:text-white transition-colors">-</button>

        <button type="button" onClick={() => handleDigit('1')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">1</button>
        <button type="button" onClick={() => handleDigit('2')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">2</button>
        <button type="button" onClick={() => handleDigit('3')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">3</button>
        <button type="button" onClick={() => handleOperation('+')} className="py-2.5 rounded-btn bg-indigo-wash text-indigo border border-indigo-200 hover:bg-indigo hover:text-white transition-colors">+</button>

        <button type="button" onClick={() => handleDigit('0')} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors col-span-2">0</button>
        <button type="button" onClick={handleDecimal} className="py-2.5 rounded-btn bg-surface border border-border text-ink hover:bg-canvas transition-colors">.</button>
        <button type="button" onClick={handleEquals} className="py-2.5 rounded-btn bg-indigo text-white font-bold hover:bg-indigo-deep shadow-xs transition-colors">=</button>
      </div>
    </div>
  );
};
