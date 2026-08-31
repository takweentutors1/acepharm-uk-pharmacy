import * as React from 'react';

interface MobileNavProps {
  currentPath?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/question-bank', label: 'Question Bank' },
    { href: '/ace', label: 'Ace AI Tutor' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Revision Guides' },
    { href: '/about', label: 'About' },
    { href: '/editorial-standards', label: 'Editorial Standards' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Navigation Menu"
        className="p-2 text-slate hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo rounded-btn transition-colors"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-50 w-full max-w-xs bg-surface border-l border-border shadow-modal p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="overflow-y-auto">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-wash text-indigo font-semibold'
                      : 'text-slate hover:text-ink hover:bg-canvas'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-border space-y-3">
          <a
            href="https://acepharm-app.pages.dev/auth/login"
            className="block text-center text-sm font-semibold text-slate hover:text-ink py-2.5 rounded-btn border border-border transition-colors"
          >
            Log in
          </a>
          <a
            href="https://acepharm-app.pages.dev/auth/register"
            className="block text-center text-sm font-semibold text-white bg-indigo hover:bg-indigo-deep py-2.5 rounded-btn shadow-sm transition-all"
          >
            Start revising free
          </a>
        </div>
      </div>
    </div>
  );
};
