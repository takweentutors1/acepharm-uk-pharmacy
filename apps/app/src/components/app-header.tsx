'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  SlidersHorizontal, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  FileSpreadsheet, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut, 
  User, 
  CreditCard,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileEdit,
  Activity,
  LifeBuoy
} from 'lucide-react';

interface AppHeaderProps {
  onOpenSubscription?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSubscription }) => {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const adminRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand + Grouped Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo to-teal flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              A
            </span>
            <span className="text-xl font-bold tracking-tight text-ink group-hover:text-indigo transition-colors">
              AcePharm
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-btn text-xs font-semibold transition-colors ${
                pathname === '/' ? 'text-indigo bg-indigo-wash font-bold' : 'text-slate hover:text-ink hover:bg-canvas'
              }`}
            >
              Dashboard
            </Link>

            <Link 
              href="/session/new" 
              className={`px-3 py-2 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pathname === '/session/new' ? 'text-indigo bg-indigo-wash font-bold' : 'text-slate hover:text-ink hover:bg-canvas'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Practice Builder
            </Link>

            <Link 
              href="/progress" 
              className={`px-3 py-2 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pathname === '/progress' ? 'text-indigo bg-indigo-wash font-bold' : 'text-slate hover:text-ink hover:bg-canvas'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Progress Analytics
            </Link>

            {/* Admin Management Dropdown (Grouped for Admin/Reviewer roles) */}
            {profile?.isAdmin && (
              <div ref={adminRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`px-3 py-2 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    pathname?.startsWith('/admin')
                      ? 'text-indigo bg-indigo-wash font-bold'
                      : 'text-slate hover:text-ink hover:bg-canvas'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo" />
                  <span>Admin Hub</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-surface border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate uppercase tracking-wider">
                      Content & Quality
                    </div>
                    <Link
                      href="/admin/curriculum"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <Layers className="w-4 h-4 text-indigo" /> Curriculum Hierarchy
                    </Link>
                    <Link
                      href="/admin/review"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-teal" /> Review Queue
                    </Link>
                    <Link
                      href="/admin/import"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Spreadsheet Importer
                    </Link>
                    <Link
                      href="/admin/questions/new"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <FileEdit className="w-4 h-4 text-indigo" /> Question Authoring
                    </Link>

                    <div className="my-1 border-t border-border" />
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate uppercase tracking-wider">
                      Governance & Oversight
                    </div>
                    <Link
                      href="/admin/ai-oversight"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <Activity className="w-4 h-4 text-rose-500" /> AI Tutor Oversight
                    </Link>
                    <Link
                      href="/admin/reported"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-slate" /> Reported Questions
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right: Authenticated User Controls & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-btn hover:bg-canvas transition-colors border border-transparent hover:border-border"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-wash to-indigo/20 border border-indigo/20 text-indigo flex items-center justify-center font-bold text-xs shadow-2xs">
                  {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-ink leading-tight flex items-center gap-1">
                    {profile?.displayName || user.email?.split('@')[0]}
                    <ChevronDown className="w-3 h-3 text-slate" />
                  </span>
                  <span className="text-[10px] text-slate font-medium">
                    {profile?.isAdmin ? 'Staff Admin' : profile?.stage === 'foundation' ? 'Foundation Trainee' : 'MPharm Learner'}
                  </span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-surface border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-ink truncate">{profile?.displayName || 'Pharmacy Learner'}</p>
                    <p className="text-[11px] text-slate truncate font-mono">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenSubscription?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-ink hover:bg-canvas rounded-lg transition-colors text-left"
                  >
                    <CreditCard className="w-4 h-4 text-indigo" />
                    <span>Membership & Invoices</span>
                  </button>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/auth/login"
                className="text-xs font-semibold text-slate hover:text-ink px-3 py-1.5 rounded-btn border border-border hover:border-slate transition-colors"
              >
                Sign In
              </a>
              <a
                href="/auth/register"
                className="text-xs font-semibold text-white bg-indigo hover:bg-indigo-deep px-3.5 py-1.5 rounded-btn shadow-xs transition-all"
              >
                Register Free
              </a>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate hover:text-ink rounded-btn hover:bg-canvas transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/' ? 'bg-indigo text-white font-bold' : 'text-slate hover:bg-canvas'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/session/new"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/session/new' ? 'bg-indigo text-white font-bold' : 'text-slate hover:bg-canvas'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Practice Builder
            </Link>
            <Link
              href="/progress"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/progress' ? 'bg-indigo text-white font-bold' : 'text-slate hover:bg-canvas'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Progress Analytics
            </Link>
          </div>

          {/* Admin Group in Mobile Drawer */}
          {profile?.isAdmin && (
            <div className="pt-2 border-t border-border space-y-1">
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider px-3">
                Admin Management
              </span>
              <Link
                href="/admin/curriculum"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <Layers className="w-4 h-4 text-indigo" /> Curriculum Hierarchy
              </Link>
              <Link
                href="/admin/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <BookOpen className="w-4 h-4 text-indigo" /> Blog & Articles CMS
              </Link>
              <Link
                href="/admin/review"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <ShieldCheck className="w-4 h-4 text-teal" /> Review Queue
              </Link>
              <Link
                href="/admin/questions/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <FileEdit className="w-4 h-4 text-indigo" /> Question Authoring
              </Link>
              <Link
                href="/admin/import"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Spreadsheet Importer
              </Link>
              <Link
                href="/admin/ai-oversight"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-canvas rounded-lg"
              >
                <Activity className="w-4 h-4 text-rose-500" /> AI Tutor Oversight
              </Link>
            </div>
          )}

          {/* Account Actions in Mobile Drawer */}
          <div className="pt-2 border-t border-border space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSubscription?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate hover:bg-canvas rounded-lg text-left"
            >
              <CreditCard className="w-4 h-4 text-indigo" /> Membership & Invoices
            </button>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg text-left font-semibold"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
