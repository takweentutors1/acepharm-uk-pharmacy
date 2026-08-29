'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  LifeBuoy, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  User, 
  Mail, 
  Send, 
  Paperclip,
  Search,
  Filter
} from 'lucide-react';

interface SupportTicket {
  id: string;
  studentName: string;
  studentEmail: string;
  category: 'subscription_billing' | 'account_access' | 'calculation_engine' | 'technical_bug';
  subject: string;
  message: string;
  timestamp: string;
  status: 'open' | 'waiting_on_student' | 'resolved';
  priority: 'urgent' | 'standard';
  responses: Array<{ sender: string; text: string; time: string; isAdmin: boolean }>;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_101',
    studentName: 'Zainab Hussain',
    studentEmail: 'zainab.hussain@ucl.ac.uk',
    category: 'subscription_billing',
    subject: 'Stripe Student Discount verification assistance',
    message: 'Hello, I signed up for the yearly plan using my UCL student email. Can you confirm if my invoice receipt has been generated with VAT breakdown?',
    timestamp: '30 mins ago',
    status: 'open',
    priority: 'standard',
    responses: [],
  },
  {
    id: 'tkt_102',
    studentName: 'George Edwards',
    studentEmail: 'g.edwards@manchester.ac.uk',
    category: 'calculation_engine',
    subject: 'Infusion rate rounding question on Paediatric IV scenario',
    message: 'On question ACP-CALC-0032, my calculator produced 4.166 ml/hr. Does the GPhC mark scheme accept 4.2 or 4.17 ml/hr?',
    timestamp: '2 hours ago',
    status: 'waiting_on_student',
    priority: 'urgent',
    responses: [
      {
        sender: 'AcePharm Clinical Support',
        text: 'Hi George! As per GPhC Section 1.3 rounding rules, unless specifically instructed otherwise in the prompt, rate calculations in mL/hr on modern infusion pumps are rounded to 1 decimal place (4.2 mL/hr). Hope that helps!',
        time: '1 hour ago',
        isAdmin: true,
      }
    ],
  },
];

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0]);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newReply = {
      sender: 'AcePharm Clinical Support',
      text: replyText.trim(),
      time: 'Just now',
      isAdmin: true,
    };

    setTickets((prev) => prev.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'waiting_on_student',
          responses: [...t.responses, newReply],
        };
      }
      return t;
    }));

    setSelectedTicket((prev) => prev ? {
      ...prev,
      status: 'waiting_on_student',
      responses: [...prev.responses, newReply],
    } : null);

    setReplyText('');
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'resolved' } : t));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: 'resolved' } : null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">Learner Support & Help Desk</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Resolve student billing queries, exam calculation doubts, and platform inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Open Tickets: {tickets.filter(t => t.status !== 'resolved').length}
          </Badge>
        </div>
      </div>

      {/* Split Ticket View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 cursor-pointer transition-all border ${
                selectedTicket?.id === ticket.id
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                  : 'border-border bg-surface hover:bg-canvas/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono text-slate">{ticket.id}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  ticket.status === 'open' ? 'bg-amber-100 text-amber-800' :
                  ticket.status === 'waiting_on_student' ? 'bg-blue-100 text-blue-800' :
                  'bg-teal-100 text-teal-800'
                }`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-ink truncate">{ticket.subject}</h4>
              <p className="text-xs text-slate line-clamp-2 mt-1">{ticket.message}</p>
              <div className="flex items-center justify-between text-[11px] text-slate/80 mt-3 pt-2 border-t border-border/60">
                <span>{ticket.studentName}</span>
                <span>{ticket.timestamp}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Selected Ticket Conversation (Right 7 Cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="p-6 border-border bg-surface shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] uppercase font-mono">
                      {selectedTicket.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate">{selectedTicket.timestamp}</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mt-1.5">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate">
                    From: <strong className="text-ink">{selectedTicket.studentName}</strong> ({selectedTicket.studentEmail})
                  </p>
                </div>
                {selectedTicket.status !== 'resolved' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveTicket(selectedTicket.id)}
                    className="text-xs flex items-center gap-1 text-teal border-teal/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </Button>
                ) : (
                  <Badge variant="success" className="text-xs">
                    Resolved
                  </Badge>
                )}
              </div>

              {/* Initial Student Inbound */}
              <div className="bg-canvas p-4 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-slate font-semibold">
                  <span>Student Initial Inquiry</span>
                </div>
                <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Message Thread */}
              {selectedTicket.responses.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate">Conversation History</h4>
                  {selectedTicket.responses.map((resp, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        resp.isAdmin
                          ? 'bg-primary/10 border border-primary/20 text-ink ml-4'
                          : 'bg-canvas border border-border text-ink mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-primary text-[11px]">
                        <span>{resp.sender}</span>
                        <span className="text-slate font-normal">{resp.time}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{resp.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Box */}
              {selectedTicket.status !== 'resolved' && (
                <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                    Post Staff Reply
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your clinical / support response to the student..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-border bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" variant="primary" className="flex items-center gap-1.5 font-bold">
                      <Send className="w-3.5 h-3.5" />
                      Send Response to Student
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          ) : (
            <div className="text-center py-12 text-slate bg-surface rounded-2xl border border-border">
              Select a support ticket from the list to review the thread.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
