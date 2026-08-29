'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  CreditCard, 
  Mail, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  KeyRound,
  GraduationCap,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'author' | 'reviewer' | 'admin' | 'superadmin';
  subscription: 'free' | 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'suspended' | 'pending';
  questionsCompleted: number;
  joinedDate: string;
  lastActive: string;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 'usr_01',
    name: 'Aisha Patel',
    email: 'aisha.patel@kcl.ac.uk',
    role: 'student',
    subscription: 'yearly',
    status: 'active',
    questionsCompleted: 412,
    joinedDate: '2026-07-14',
    lastActive: '10 mins ago',
  },
  {
    id: 'usr_02',
    name: 'Dr. Marcus Vance (MPharm, PhD)',
    email: 'marcus.vance@acepharm.co.uk',
    role: 'reviewer',
    subscription: 'lifetime',
    status: 'active',
    questionsCompleted: 0,
    joinedDate: '2026-06-01',
    lastActive: '1 hour ago',
  },
  {
    id: 'usr_03',
    name: 'Liam O’Connor',
    email: 'liam.oconnor@bath.ac.uk',
    role: 'student',
    subscription: 'free',
    status: 'active',
    questionsCompleted: 26,
    joinedDate: '2026-08-20',
    lastActive: 'Yesterday',
  },
  {
    id: 'usr_04',
    name: 'Sarah Jenkins (Clinical Lead)',
    email: 'sarah.jenkins@acepharm.co.uk',
    role: 'admin',
    subscription: 'lifetime',
    status: 'active',
    questionsCompleted: 15,
    joinedDate: '2026-05-10',
    lastActive: 'Just now',
  },
  {
    id: 'usr_05',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.m@manchester.ac.uk',
    role: 'student',
    subscription: 'monthly',
    status: 'suspended',
    questionsCompleted: 88,
    joinedDate: '2026-08-01',
    lastActive: '5 days ago',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: MockUser['role']) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
    }
  };

  const handleStatusToggle = (userId: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">User Management & Access Control</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Manage student registrations, subscription tiers, author permissions, and clinical reviewer credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            Total Users: {users.length}
          </Badge>
          <Badge variant="success" className="px-3 py-1 text-xs">
            Active Subscriptions: {users.filter(u => u.subscription !== 'free').length}
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search by student name or university email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm bg-canvas border border-border rounded-lg px-3 py-2 text-ink focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="student">Student / Trainee</option>
            <option value="author">Content Author</option>
            <option value="reviewer">Clinical Reviewer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas border-b border-border text-xs uppercase text-slate font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-ink">{user.name}</div>
                    <div className="text-xs text-slate">{user.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'reviewer' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'author' ? 'bg-teal-100 text-teal-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      user.subscription === 'yearly' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      user.subscription === 'monthly' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      user.subscription === 'lifetime' ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.subscription}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate">
                    <div>{user.questionsCompleted} Qs answered</div>
                    <div className="text-[11px] text-slate/70">Last: {user.lastActive}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      user.status === 'active' ? 'text-teal' : 'text-danger'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-teal' : 'bg-danger'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected User Management Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="max-w-lg w-full bg-surface border-border p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">{selectedUser.name}</h3>
                <p className="text-xs text-slate">{selectedUser.email} &bull; ID: {selectedUser.id}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>
                ✕
              </Button>
            </div>

            {/* Role Assignment */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate">Role & Permissions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['student', 'author', 'reviewer', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(selectedUser.id, r)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      selectedUser.role === r
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-canvas text-slate hover:border-slate'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription & Account State */}
            <div className="bg-canvas p-4 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate">Subscription:</span>
                <span className="font-bold text-ink uppercase">{selectedUser.subscription}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Total Completed Questions:</span>
                <span className="font-bold text-ink">{selectedUser.questionsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Member Since:</span>
                <span className="text-ink">{selectedUser.joinedDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant={selectedUser.status === 'active' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleStatusToggle(selectedUser.id)}
                className="flex-1"
              >
                {selectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
