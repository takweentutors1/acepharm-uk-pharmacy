/**
 * Card Component
 * Generic content container with border, shadow, and padding
 */

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-[15px] p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Panel Component
 * Larger page-level container with more spacing
 */
export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-[22px] p-8 ${className}`}>
      {children}
    </div>
  );
}
