/**
 * Question Option Component
 * A–E choice button with border-based selection, feedback states
 */

export function OptionButton({
  label,
  content,
  selected = false,
  feedback = null, // 'correct' | 'wrong'
  disabled = false,
  onClick,
}) {
  let borderClass = 'border-border';
  let bgClass = 'bg-surface';
  let markBgClass = 'bg-canvas';
  let markTextClass = 'text-ink';

  if (selected && !feedback) {
    borderClass = 'border-indigo';
    bgClass = 'bg-indigo-wash shadow-[inset_0_0_0_1px] shadow-indigo';
    markBgClass = 'bg-indigo';
    markTextClass = 'text-white';
  }

  if (feedback === 'correct') {
    borderClass = 'border-success';
    bgClass = 'bg-success-wash';
    markBgClass = 'bg-success';
    markTextClass = 'text-white';
  }

  if (feedback === 'wrong') {
    borderClass = 'border-danger';
    bgClass = 'bg-danger-wash';
    markBgClass = 'bg-danger';
    markTextClass = 'text-white';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex gap-3 w-full text-left p-[15px_17px] border border-solid rounded-[13px] ${bgClass} ${borderClass} cursor-pointer transition-all hover:border-indigo disabled:cursor-default items-start min-h-14`}
    >
      <div className={`w-7 h-7 rounded-2 border border-border ${markBgClass} ${markTextClass} text-center text-xs font-mono font-semibold flex items-center justify-center flex-shrink-0`}>
        {label}
      </div>
      <div className="flex-1 text-sm">{content}</div>
    </button>
  );
}
