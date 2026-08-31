'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  BookOpen
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
