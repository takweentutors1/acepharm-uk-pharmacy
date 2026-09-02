'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Card, Skeleton } from '@acepharm/ui';
import { 
  ArrowLeft, 
  Layers, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileEdit, 
  HelpCircle, 
  FileText, 
  Activity, 
  LifeBuoy, 
  Users,
  BookOpen,
  Lock,
  AlertTriangle
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  const navItems = [
    { href: '/admin/curriculum', label: 'Curriculum', icon: Layers },
    { href: '/admin/review', label: 'Review Queue', icon: ShieldCheck },
    { href: '/admin/import', label: 'Importer', icon: FileSpreadsheet },
    { href: '/admin/questions/new', label: 'New Question', icon: FileEdit },
    { href: '/admin/blog', label: 'Blog Editor', icon: BookOpen },
    { href: '/admin/reported', label: 'Reports', icon: HelpCircle },
    { href: '/admin/subtopic-notes', label: 'Notes', icon: FileText },
    { href: '/admin/ai-oversight', label: 'AI Oversight', icon: Activity },
    { href: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-canvas">
        <header className="border-b border-border bg-surface h-14 flex items-center px-6">
          <Skeleton className="h-6 w-36 rounded-md" />
        </header>
        <div className="max-w-7xl mx-auto w-full p-8 space-y-6">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Guard
  if (!user) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-canvas items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4 bg-surface border-border shadow-lg">
          <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson mx-auto flex items-center justify-center border border-crimson/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Authentication Required</h2>
            <p className="text-xs text-slate mt-1.5 leading-relaxed">
              You must be signed in with an authorized pharmacy educator or clinical reviewer account to access the AcePharm Admin Portal.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/auth/login" className="w-full">
              <Button variant="primary" size="md" className="w-full text-xs font-bold">
                Sign In to Continue
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" size="md" className="w-full text-xs font-semibold">
                Back to Student Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Unauthorized Role Guard
  const hasAdminAccess = Boolean(profile?.isAdmin || profile?.isReviewer);
  if (!hasAdminAccess) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-canvas items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4 bg-surface border-border shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-light text-amber mx-auto flex items-center justify-center border border-amber/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Access Restricted</h2>
            <p className="text-xs text-slate mt-1.5 leading-relaxed">
              Your account ({user.email}) does not have administrative or reviewer permissions. If you are an author or clinical reviewer, please contact your content lead.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/" className="w-full inline-block">
              <Button variant="primary" size="md" className="w-full text-xs font-bold">
                Return to Student Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 4. Authorized Admin Portal Render
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-canvas">
      {/* Top Admin Header with Back Button */}
      <header className="border-b border-border bg-surface sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-ink px-2.5 py-1.5 rounded-btn bg-canvas border border-border hover:border-slate transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-indigo" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo hidden sm:inline-block">
              Admin Portal
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-btn transition-colors ${
                    isActive
                      ? 'bg-indigo text-white font-bold'
                      : 'text-slate hover:text-ink hover:bg-canvas'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Admin Page Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
