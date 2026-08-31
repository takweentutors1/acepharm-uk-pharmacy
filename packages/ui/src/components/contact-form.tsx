'use client';

import * as React from 'react';
import { Card } from './card';
import { Button } from './button';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [category, setCategory] = React.useState('Account support');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = React.useState('');

  const API_URL = 'https://acepharm-api.takweencentreuk.workers.dev';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setFeedback('');

    try {
      const res = await fetch(`${API_URL}/api/v1/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFeedback(data.message || 'Thank you! Your message has been sent.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setFeedback(data.error || 'Could not send message. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setFeedback('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-surface border border-border rounded-card shadow-card space-y-6">
      {status === 'success' && (
        <div className="p-4 rounded-btn bg-success-wash border border-success/30 text-success text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Message Sent Successfully</p>
            <p className="mt-1 text-slate">{feedback}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 rounded-btn bg-danger-wash border border-danger/30 text-danger text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Failed to Send</p>
            <p className="mt-1">{feedback}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Category
          </label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-btn text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
          >
            <option>Account support</option>
            <option>Billing & Subscriptions</option>
            <option>Clinical content question</option>
            <option>Report an erratum</option>
            <option>Feature suggestion</option>
            <option>University / Institution Partnership</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Your Name
          </label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aisha Patel" 
            className="w-full px-3 py-2 border border-border rounded-btn text-sm text-ink bg-surface placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@university.ac.uk" 
            className="w-full px-3 py-2 border border-border rounded-btn text-sm text-ink bg-surface placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Message
          </label>
          <textarea 
            rows={5} 
            required 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question, concern or feedback in detail..." 
            className="w-full px-3 py-2 border border-border rounded-btn text-sm text-ink bg-surface placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-bold shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting message...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send message
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
