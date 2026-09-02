import * as React from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  category: string;
  items: FaqItem[];
}

interface FaqAccordionProps {
  groups: FaqGroup[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ groups }) => {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({
    '0-0': true, // Open the very first item by default
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-12">
      {groups.map((group, groupIdx) => (
        <div key={group.category} className="space-y-4">
          <h2 className="text-xl font-bold text-ink pb-2 border-b border-border">
            {group.category}
          </h2>
          <div className="space-y-3">
            {group.items.map((item, itemIdx) => {
              const key = `${groupIdx}-${itemIdx}`;
              const isOpen = !!openItems[key];
              return (
                <div
                  key={item.question}
                  className="rounded-card border border-border bg-surface overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(key)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm text-ink hover:text-indigo focus-visible:outline-none focus-visible:bg-canvas transition-colors"
                  >
                    <span>{item.question}</span>
                    <svg
                      className={`w-5 h-5 text-slate transform transition-transform duration-200 shrink-0 ml-4 ${
                        isOpen ? 'rotate-180 text-indigo' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate leading-relaxed border-t border-border/50">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
