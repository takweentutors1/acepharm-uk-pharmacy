import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { blogPosts, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import type { AuthContext } from '../middleware/auth';

export const blogRoutes = new Hono<AuthContext>();

// Seed default articles if empty
const DEFAULT_POSTS = [
  {
    id: 'post-calc-01',
    slug: 'gphc-calculations-essential-methods',
    title: 'GPhC Calculations: 5 High-Yield Pitfalls and Step-by-Step Fixes',
    summary: 'Mastering displacement volumes, pediatric mg/kg body weight scaling, and infusion rate conversions with diagnostic precision.',
    contentMarkdown: `## 1. Displacement Volumes in Antibiotic Reconstitution

Displacement volume is the volume occupied by the dry powder antibiotic when reconstituted with water. A common error in Paper 1 calculations is subtracting the displacement volume instead of accounting for the final concentration.

\`\`\`
Total Final Volume = Added Water Volume + Powder Displacement Volume
\`\`\`

Always check if the question asks for the volume of diluent to add, or the final concentration of active drug in the reconstituted syrup.

---

## 2. Body Weight Scaling in Paediatric Dosing

When calculating paediatric doses based on body surface area (BSA) or mg/kg body weight:
- Check if ideal body weight (IBW) is specified for obese patients (e.g. aminoglycosides).
- Never round intermediate fractional doses — round only at the final measurable syringe graduation.

---

## 3. Rate of Infusion Conversions

Remember:
- \`Dose rate (mg/min) = [Total Drug (mg) / Total Volume (mL)] * Infusion Rate (mL/min)\`
- Always double check whether the pump rate is calibrated in drops/min (using the drop factor) or mL/hr.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-18T09:00:00Z'),
    readingTimeMinutes: 5,
    tagsJson: JSON.stringify(['Calculations', 'GPhC Paper 1', 'Paediatrics']),
  },
  {
    id: 'post-asthma-01',
    slug: 'asthma-bts-sign-vs-nice-guideline-comparison',
    title: 'Asthma Inhaler Stepping: BTS/SIGN vs NICE Guidance Compared',
    summary: 'Understanding the practical differences in adult asthma management steps, MART regimens, and preventer counselling points.',
    contentMarkdown: `## BTS/SIGN vs NICE Asthma Stepping

UK pharmacy exams frequently test the differentiation between British Thoracic Society (BTS/SIGN 158) stepping and NICE NG80 recommendations.

### Key Divergences:
1. **Initial Add-on Therapy**:
   - BTS/SIGN recommends adding an inhaled long-acting beta-2 agonist (LABA) to low-dose ICS.
   - NICE recommends adding a Leukotriene Receptor Antagonist (LTRA) such as Montelukast before increasing ICS doses or introducing LABAs in certain clinical presentations.

2. **Maintenance and Reliever Therapy (MART)**:
   - MART utilises a single inhaler containing both an ICS (e.g. formoterol/beclometasone or formoterol/budesonide) for daily prevention and symptom relief.
   - Patient counselling must emphasise that a separate blue salbutamol inhaler is NOT required and should be discontinued during MART to prevent confusion.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-12T09:00:00Z'),
    readingTimeMinutes: 4,
    tagsJson: JSON.stringify(['Clinical Revision', 'Respiratory', 'Asthma']),
  },
  {
    id: 'post-study-01',
    slug: 'mpharm-active-recall-spaced-repetition',
    title: 'How to Structure Spaced Repetition for MPharm Final Exams',
    summary: 'Why raw percentage scores mislead learners, and how calibrating confidence against first-attempt accuracy eliminates clinical blind spots.',
    contentMarkdown: `## The Illusion of Competence in Pharmacy Revision

Repeating the same 50 questions until achieving a 95% score provides a false sense of mastery. Research in cognitive psychology shows that:
- **First-Attempt Accuracy** reflects genuine retrieval and long-term memory consolidation.
- **Repeat-Attempt Accuracy** primarily measures short-term recognition memory.

### The SM-2 Interval Strategy:
Schedule reviews at expanding intervals (1 day, 6 days, 16 days, 35 days). When a question is answered incorrectly or with low confidence, reset the interval and review the core therapeutic mechanism before testing again.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-05T09:00:00Z'),
    readingTimeMinutes: 6,
    tagsJson: JSON.stringify(['MPharm Study', 'Spaced Repetition', 'SM-2']),
  },
];

// 1. Public: List all published posts
blogRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  
  let posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));

  if (posts.length === 0) {
    // Seed default posts on first run
    for (const post of DEFAULT_POSTS) {
      await db.insert(blogPosts).values({
        ...post,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }
    posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  return c.json({ posts });
});

// 2. Public: Get published post by slug
blogRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = drizzle(c.env.DB);

  let [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) {
    // Check default posts
    const match = DEFAULT_POSTS.find((p) => p.slug === slug);
    if (match) {
      await db.insert(blogPosts).values({
        ...match,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();

      [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);
    }
  }

  if (!post || (!post.published && c.get('user')?.role === 'super_admin')) {
    return c.json({ error: 'Blog post not found' }, 404);
  }

  return c.json({ post });
});

// 3. Admin: List all posts (draft & published)
blogRoutes.get('/admin/all', requireAuth, requireRole(['marketing_editor', 'super_admin']), async (c) => {
  const db = drizzle(c.env.DB);
  const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  return c.json({ posts });
});

// 4. Admin: Create or update blog post
blogRoutes.post('/admin/save', requireAuth, requireRole(['marketing_editor', 'super_admin']), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json<{
    id?: string;
    slug: string;
    title: string;
    summary: string;
    contentMarkdown: string;
    coverImageUrl?: string;
    published?: boolean;
    readingTimeMinutes?: number;
    tagsJson?: string;
  }>();

  if (!body.slug || !body.title || !body.contentMarkdown) {
    return c.json({ error: 'Validation: slug, title, and contentMarkdown are required' }, 400);
  }

  const postId = body.id || `post-${crypto.randomUUID()}`;
  const now = new Date();

  await db
    .insert(blogPosts)
    .values({
      id: postId,
      slug: body.slug,
      title: body.title,
      summary: body.summary || '',
      contentMarkdown: body.contentMarkdown,
      coverImageUrl: body.coverImageUrl || null,
      authorId: user.id,
      published: Boolean(body.published),
      publishedAt: body.published ? now : null,
      readingTimeMinutes: body.readingTimeMinutes || 4,
      tagsJson: body.tagsJson || '[]',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: blogPosts.id,
      set: {
        slug: body.slug,
        title: body.title,
        summary: body.summary || '',
        contentMarkdown: body.contentMarkdown,
        coverImageUrl: body.coverImageUrl || null,
        published: Boolean(body.published),
        publishedAt: body.published ? now : null,
        readingTimeMinutes: body.readingTimeMinutes || 4,
        tagsJson: body.tagsJson || '[]',
        updatedAt: now,
      },
    });

  return c.json({ success: true, id: postId, slug: body.slug });
});
