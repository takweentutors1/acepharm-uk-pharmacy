import * as React from 'react';
import { Card } from './card';

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  readTime?: string;
}

interface TopicFilterProps {
  categories: string[];
  articles: Article[];
}

export const TopicFilter: React.FC<TopicFilterProps> = ({ categories, articles }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const filteredArticles = selectedCategory === 'All'
    ? articles
    : articles.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

  const allCategories = ['All', ...categories];

  return (
    <div>
      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs ${
                isSelected
                  ? 'bg-indigo text-white shadow-sm'
                  : 'bg-surface border border-border text-slate hover:border-indigo hover:text-ink'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filtered Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredArticles.map((article) => (
          <Card
            key={article.slug}
            className="p-6 bg-surface border border-border rounded-card shadow-xs flex flex-col justify-between hover:shadow-card hover:border-indigo/30 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-light mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-wash text-indigo font-bold">
                  {article.category}
                </span>
                <span>{article.date}</span>
              </div>
              <a href={`/blog/${article.slug}`} className="block group">
                <h3 className="text-base font-bold text-ink group-hover:text-indigo transition-colors">
                  {article.title}
                </h3>
              </a>
              <p className="text-xs text-slate mt-2.5 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <a
                href={`/blog/${article.slug}`}
                className="text-xs font-bold text-indigo hover:text-indigo-deep flex items-center gap-1 transition-colors"
              >
                Read revision guide →
              </a>
              {article.readTime && (
                <span className="text-micro text-slate-light">{article.readTime}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-16 text-slate text-sm">
          No revision guides found under "{selectedCategory}". Check back soon as new clinical guides are added.
        </div>
      )}
    </div>
  );
};
