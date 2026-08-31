'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Badge, MarkdownRenderer } from '@acepharm/ui';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Table, 
  Eye, 
  FileEdit, 
  Clock, 
  Save, 
  Plus, 
  Columns
} from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
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

  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = selectedPost.contentMarkdown;

    const selectedText = currentText.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    setSelectedPost({ ...selectedPost, contentMarkdown: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const wordCount = selectedPost.contentMarkdown.trim() ? selectedPost.contentMarkdown.trim().split(/\s+/).length : 0;
  const computedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleSave = async () => {
    if (!selectedPost.slug || !selectedPost.title || !selectedPost.contentMarkdown) {
      alert('Please fill in Title, URL Slug, and Markdown content.');
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

      const postPayload = {
        ...selectedPost,
        readingTimeMinutes: computedReadingTime,
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/blog/admin/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        setSavedStatus('Post saved & synced with D1 database successfully!');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-indigo" /> Advanced Blog & Article CMS
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Rich interactive markdown editor with real-time preview, AEO meta formatting, and instant Cloudflare D1 publishing.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedPost({
              slug: '',
              title: '',
              summary: '',
              contentMarkdown: '',
              published: false,
              readingTimeMinutes: 4,
              tagsJson: '["MPharm Study"]',
            });
            setSavedStatus(null);
          }}
          className="text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate">Existing Articles</span>
            <span className="text-[11px] font-mono text-slate">{posts.length} Total</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {posts.map((p) => {
              const isSelected = selectedPost.slug === p.slug;
              return (
                <div
                  key={p.slug}
                  onClick={() => {
                    setSelectedPost(p);
                    setSavedStatus(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo bg-indigo/5 shadow-sm ring-1 ring-indigo/20'
                      : 'border-border bg-surface hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-slate truncate max-w-[130px]">{p.slug}</span>
                    <Badge variant={p.published ? 'success' : 'default'} className="text-[9px] py-0">
                      {p.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs text-ink line-clamp-2 leading-snug">{p.title || 'Untitled Post'}</h4>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.readingTimeMinutes || 4}m read
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 sm:p-6 bg-surface border-border shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Article Title</label>
                <input
                  type="text"
                  value={selectedPost.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = selectedPost.slug ? selectedPost.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setSelectedPost({ ...selectedPost, title, slug: autoSlug });
                  }}
                  placeholder="e.g. GPhC Calculations: 5 High-Yield Pitfalls"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-ink bg-canvas/30 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-indigo/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">URL Slug</label>
                <input
                  type="text"
                  value={selectedPost.slug}
                  onChange={(e) => setSelectedPost({ ...selectedPost, slug: e.target.value })}
                  placeholder="e.g. gphc-calculations-essential-guide"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono text-ink bg-canvas/30 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-indigo/20"
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
                className="w-full px-3 py-2 border border-border rounded-lg text-xs text-ink bg-canvas/30 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-indigo/20"
                placeholder="Write a clear, standalone 2-3 sentence answer for search engines and answer engines..."
              />
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              <div className="bg-canvas/60 p-2 border-b border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    title="Bold"
                    onClick={() => insertFormatting('**', '**', 'bold text')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Italic"
                    onClick={() => insertFormatting('*', '*', 'italic text')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-border mx-1" />

                  <button
                    type="button"
                    title="Heading 1"
                    onClick={() => insertFormatting('\n# ', '\n', 'Heading 1')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Heading 2"
                    onClick={() => insertFormatting('\n## ', '\n', 'Heading 2')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Heading 3"
                    onClick={() => insertFormatting('\n### ', '\n', 'Heading 3')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-border mx-1" />

                  <button
                    type="button"
                    title="Bullet List"
                    onClick={() => insertFormatting('\n- ', '\n', 'List item')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Numbered List"
                    onClick={() => insertFormatting('\n1. ', '\n', 'List item')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Blockquote Callout"
                    onClick={() => insertFormatting('\n> ', '\n', 'Important clinical takeaway or guidance')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Code Block"
                    onClick={() => insertFormatting('\n```\n', '\n```\n', '// Dose formula or algorithm')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Insert Link"
                    onClick={() => insertFormatting('[', '](https://)', 'Link title')}
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Insert Clinical Table"
                    onClick={() =>
                      insertFormatting(
                        '\n| Step | Drug Class | Key Consideration |\n| :--- | :--- | :--- |\n| Step 1 | CCB (Amlodipine) | First-line in Black African heritage |\n| Step 2 | CCB + ACEi/ARB | Add Ramipril if uncontrolled |\n',
                        ''
                      )
                    }
                    className="p-1.5 rounded hover:bg-surface text-slate hover:text-ink transition-colors"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      viewMode === 'edit' ? 'bg-indigo text-white shadow-2xs' : 'text-slate hover:text-ink'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      viewMode === 'split' ? 'bg-indigo text-white shadow-2xs' : 'text-slate hover:text-ink'
                    }`}
                  >
                    <Columns className="w-3 h-3" /> Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      viewMode === 'preview' ? 'bg-indigo text-white shadow-2xs' : 'text-slate hover:text-ink'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={viewMode === 'edit' ? 'col-span-full' : ''}>
                    <textarea
                      ref={textareaRef}
                      rows={16}
                      value={selectedPost.contentMarkdown}
                      onChange={(e) => setSelectedPost({ ...selectedPost, contentMarkdown: e.target.value })}
                      className="w-full p-4 font-mono text-xs text-ink leading-relaxed bg-surface focus:outline-none resize-y min-h-[380px]"
                      placeholder="Write your article in formatted markdown... Use toolbar buttons above to insert headings, tables, clinical callouts, and lists."
                    />
                  </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={`p-4 bg-canvas/30 overflow-y-auto max-h-[500px] min-h-[380px] ${viewMode === 'preview' ? 'col-span-full' : ''}`}>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate">Live Rendered Output</span>
                      <Badge variant="info" className="text-[9px]">Astro Marketing Output</Badge>
                    </div>
                    {selectedPost.contentMarkdown ? (
                      <MarkdownRenderer content={selectedPost.contentMarkdown} />
                    ) : (
                      <div className="text-xs text-slate italic py-8 text-center">
                        Live preview will appear here as you type in the editor...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate">
                <span className="font-mono"><strong>{wordCount}</strong> words</span>
                <span>•</span>
                <span className="font-mono"><strong>~{computedReadingTime}</strong> min read</span>
                <span>•</span>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={selectedPost.published}
                    onChange={(e) => setSelectedPost({ ...selectedPost, published: e.target.checked })}
                    className="rounded text-indigo focus:ring-indigo h-4 w-4"
                  />
                  <span>Publish to Live Marketing Site</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                {savedStatus && (
                  <span className={`text-xs font-semibold ${savedStatus.includes('Error') ? 'text-danger' : 'text-success'}`}>
                    {savedStatus}
                  </span>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-bold shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving to D1...' : 'Save & Publish to D1'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
