'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@acepharm/ui';

interface BlogPostAdmin {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  published: boolean;
  readingTimeMinutes: number;
  tagsJson: string;
}

export function AdminBlogEditor({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [posts, setPosts] = useState<BlogPostAdmin[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPostAdmin>({
    slug: '',
    title: '',
    summary: '',
    contentMarkdown: '',
    published: false,
    readingTimeMinutes: 4,
    tagsJson: '["MPharm Study"]',
  });
  const [loading, setLoading] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Try admin list if token available, or fall back to public list
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        const { auth } = await import('@/lib/firebase');
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = token ? `${apiBaseUrl}/api/v1/blog/admin/all` : `${apiBaseUrl}/api/v1/blog`;
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.warn('Failed loading blog posts:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedPost.slug || !selectedPost.title || !selectedPost.contentMarkdown) {
      alert('Please fill in title, slug and markdown content.');
      return;
    }

    setLoading(true);
    setSavedStatus(null);

    try {
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        const { auth } = await import('@/lib/firebase');
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiBaseUrl}/api/v1/blog/admin/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(selectedPost),
      });

      if (res.ok) {
        setSavedStatus('Post saved and synced with D1 successfully!');
        fetchPosts();
      } else {
        const err = await res.json();
        setSavedStatus(`Error: ${err.error || 'Failed saving'}`);
      }
    } catch (e: any) {
      setSavedStatus(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Blog Markdown Editor</h1>
          <p className="text-xs text-ink-muted mt-1">Author and publish AEO/GEO-optimised revision guides directly into D1.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedPost({
              slug: 'new-revision-guide',
              title: 'New Clinical Revision Guide',
              summary: 'One-paragraph self-contained summary answering the core question for AEO.',
              contentMarkdown: '## Core Principle\n\nWrite high-yield clinical content here...',
              published: false,
              readingTimeMinutes: 4,
              tagsJson: '["Clinical Revision"]',
            });
          }}
        >
          + New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Post List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Existing Articles</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {posts.map((p) => (
              <div
                key={p.slug}
                onClick={() => setSelectedPost(p)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedPost.slug === p.slug
                    ? 'border-primary bg-primary-50/50 shadow-xs'
                    : 'border-border-subtle bg-white hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary truncate max-w-[150px]">{p.slug}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-ink mt-1 line-clamp-1">{p.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6 bg-white border border-border-subtle rounded-2xl shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={selectedPost.title}
                  onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">URL Slug</label>
                <input
                  type="text"
                  value={selectedPost.slug}
                  onChange={(e) => setSelectedPost({ ...selectedPost, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Self-Contained Summary (Meta Description & AEO Excerpt)
              </label>
              <textarea
                rows={2}
                value={selectedPost.summary}
                onChange={(e) => setSelectedPost({ ...selectedPost, summary: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Write a stand-alone, quotable 2-3 sentence answer for answer engines..."
              />
            </div>

            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'edit' ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-raised'
                  }`}
                >
                  Markdown Source
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'preview' ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-raised'
                  }`}
                >
                  Live Preview
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPost.published}
                    onChange={(e) => setSelectedPost({ ...selectedPost, published: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-ink">Publish to Live Marketing Site</span>
                </label>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                rows={12}
                value={selectedPost.contentMarkdown}
                onChange={(e) => setSelectedPost({ ...selectedPost, contentMarkdown: e.target.value })}
                className="w-full p-4 border border-border rounded-xl font-mono text-xs text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Write in clean markdown (## Headings, ```code blocks, bullet points)..."
              />
            ) : (
              <div className="p-4 border border-border-subtle rounded-xl bg-surface-raised/50 min-h-[250px] text-xs text-ink space-y-2 whitespace-pre-wrap font-sans">
                <h3 className="font-bold text-sm text-ink mb-2">Preview Output:</h3>
                {selectedPost.contentMarkdown}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {savedStatus && (
                <span className={`text-xs font-medium ${savedStatus.includes('Error') ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {savedStatus}
                </span>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? 'Saving...' : 'Save & Publish to D1'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
