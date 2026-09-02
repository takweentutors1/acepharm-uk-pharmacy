import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, asc, inArray } from 'drizzle-orm';
import { pathways, categories, subtopics, subtopicNotes } from '../db/schema';
import type { AuthContext } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const curriculumRouter = new Hono<AuthContext>();

// Restrict modification routes to content_lead, super_admin, or author
const requireContentEditor = requireRole(['author', 'clinical_reviewer', 'content_lead', 'super_admin']);

// ==========================================
// 1. Full Hierarchy Tree (Read)
// ==========================================

curriculumRouter.get('/tree', async (c) => {
  const db = drizzle(c.env.DB);

  const allPathways = await db.select().from(pathways).orderBy(asc(pathways.sortOrder));
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const allSubtopics = await db.select().from(subtopics).orderBy(asc(subtopics.sortOrder));

  const subtopicsByCat = new Map<string, typeof allSubtopics>();
  for (const s of allSubtopics) {
    const list = subtopicsByCat.get(s.categoryId) || [];
    list.push(s);
    subtopicsByCat.set(s.categoryId, list);
  }

  const categoriesByPathway = new Map<string, any[]>();
  for (const cat of allCategories) {
    const list = categoriesByPathway.get(cat.pathwayId) || [];
    list.push({
      ...cat,
      subtopics: subtopicsByCat.get(cat.id) || [],
    });
    categoriesByPathway.set(cat.pathwayId, list);
  }

  const tree = allPathways.map((p) => ({
    ...p,
    categories: categoriesByPathway.get(p.id) || [],
  }));

  return c.json({ pathways: tree });
});

// ==========================================
// 2. Pathways CRUD
// ==========================================

curriculumRouter.get('/pathways', async (c) => {
  const db = drizzle(c.env.DB);
  const data = await db.select().from(pathways).orderBy(asc(pathways.sortOrder));
  return c.json({ pathways: data });
});

curriculumRouter.post('/pathways', requireContentEditor, async (c) => {
  const body = await c.req.json<{ name: string; code: string; description?: string; sortOrder?: number }>();
  if (!body.name || !body.code) {
    return c.json({ error: 'Validation: name and code are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const id = crypto.randomUUID();

  const [created] = await db
    .insert(pathways)
    .values({
      id,
      name: body.name.trim(),
      code: body.code.toLowerCase().trim(),
      description: body.description || null,
      sortOrder: body.sortOrder ?? 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ pathway: created }, 201);
});

curriculumRouter.put('/pathways/:id', requireContentEditor, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing pathway id' }, 400);
  const body = await c.req.json<{ name?: string; code?: string; description?: string; sortOrder?: number; active?: boolean }>();

  const db = drizzle(c.env.DB);
  const updateData: any = { updatedAt: new Date() };

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.code !== undefined) updateData.code = body.code.toLowerCase().trim();
  if (body.description !== undefined) updateData.description = body.description;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.active !== undefined) updateData.active = body.active; // Archive-without-delete support

  const [updated] = await db
    .update(pathways)
    .set(updateData)
    .where(eq(pathways.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Pathway not found' }, 404);
  }

  return c.json({ pathway: updated });
});

// ==========================================
// 3. Categories CRUD
// ==========================================

curriculumRouter.get('/categories', async (c) => {
  const pathwayId = c.req.query('pathway_id');
  const db = drizzle(c.env.DB);

  let query = db.select().from(categories);
  if (pathwayId) {
    const data = await query.where(eq(categories.pathwayId, pathwayId)).orderBy(asc(categories.sortOrder));
    return c.json({ categories: data });
  }

  const data = await query.orderBy(asc(categories.sortOrder));
  return c.json({ categories: data });
});

curriculumRouter.post('/categories', requireContentEditor, async (c) => {
  const body = await c.req.json<{ pathwayId: string; name: string; code: string; description?: string; sortOrder?: number }>();
  if (!body.pathwayId || !body.name || !body.code) {
    return c.json({ error: 'Validation: pathwayId, name, and code are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const id = crypto.randomUUID();

  const [created] = await db
    .insert(categories)
    .values({
      id,
      pathwayId: body.pathwayId,
      name: body.name.trim(),
      code: body.code.toLowerCase().trim(),
      description: body.description || null,
      sortOrder: body.sortOrder ?? 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ category: created }, 201);
});

curriculumRouter.put('/categories/:id', requireContentEditor, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing category id' }, 400);
  const body = await c.req.json<{ name?: string; code?: string; description?: string; sortOrder?: number; active?: boolean }>();

  const db = drizzle(c.env.DB);
  const updateData: any = { updatedAt: new Date() };

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.code !== undefined) updateData.code = body.code.toLowerCase().trim();
  if (body.description !== undefined) updateData.description = body.description;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.active !== undefined) updateData.active = body.active; // Archive-without-delete

  const [updated] = await db
    .update(categories)
    .set(updateData)
    .where(eq(categories.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json({ category: updated });
});

// ==========================================
// 4. Subtopics CRUD
// ==========================================

curriculumRouter.get('/subtopics', async (c) => {
  const categoryId = c.req.query('category_id');
  const db = drizzle(c.env.DB);

  if (categoryId) {
    const data = await db.select().from(subtopics).where(eq(subtopics.categoryId, categoryId)).orderBy(asc(subtopics.sortOrder));
    return c.json({ subtopics: data });
  }

  const data = await db.select().from(subtopics).orderBy(asc(subtopics.sortOrder));
  return c.json({ subtopics: data });
});

curriculumRouter.post('/subtopics', requireContentEditor, async (c) => {
  const body = await c.req.json<{ categoryId: string; name: string; code: string; description?: string; sortOrder?: number }>();
  if (!body.categoryId || !body.name || !body.code) {
    return c.json({ error: 'Validation: categoryId, name, and code are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const id = crypto.randomUUID();

  const [created] = await db
    .insert(subtopics)
    .values({
      id,
      categoryId: body.categoryId,
      name: body.name.trim(),
      code: body.code.toLowerCase().trim(),
      description: body.description || null,
      sortOrder: body.sortOrder ?? 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ subtopic: created }, 201);
});

curriculumRouter.put('/subtopics/:id', requireContentEditor, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing subtopic id' }, 400);
  const body = await c.req.json<{ name?: string; code?: string; description?: string; sortOrder?: number; active?: boolean }>();

  const db = drizzle(c.env.DB);
  const updateData: any = { updatedAt: new Date() };

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.code !== undefined) updateData.code = body.code.toLowerCase().trim();
  if (body.description !== undefined) updateData.description = body.description;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.active !== undefined) updateData.active = body.active; // Archive-without-delete

  const [updated] = await db
    .update(subtopics)
    .set(updateData)
    .where(eq(subtopics.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Subtopic not found' }, 404);
  }

  return c.json({ subtopic: updated });
});

// ==========================================
// 5. Bulk Reordering
// ==========================================

curriculumRouter.post('/reorder', requireContentEditor, async (c) => {
  const body = await c.req.json<{
    entity: 'pathways' | 'categories' | 'subtopics';
    items: { id: string; sortOrder: number }[];
  }>();

  if (!body.entity || !Array.isArray(body.items)) {
    return c.json({ error: 'Validation: entity and items array are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const targetTable = body.entity === 'pathways' ? pathways : body.entity === 'categories' ? categories : subtopics;

  for (const item of body.items) {
    await db
      .update(targetTable)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(targetTable.id, item.id));
  }

  return c.json({ status: 'ok', updatedCount: body.items.length });
});

// ==========================================
// 6. Subtopic Clinical Notes
// ==========================================

curriculumRouter.get('/subtopics/:id/notes', async (c) => {
  const subtopicId = c.req.param('id');
  if (!subtopicId) return c.json({ error: 'Missing subtopic id' }, 400);

  const db = drizzle(c.env.DB);
  const [note] = await db
    .select()
    .from(subtopicNotes)
    .where(eq(subtopicNotes.subtopicId, subtopicId))
    .limit(1);

  if (!note) {
    return c.json({
      note: {
        subtopicId,
        contentMarkdown: '',
        published: false,
        version: 1,
      },
    });
  }

  return c.json({ note });
});

import { chunkSubtopicNote } from '../lib/chunking-pipeline';

curriculumRouter.put('/subtopics/:id/notes', requireContentEditor, async (c) => {
  const subtopicId = c.req.param('id');
  if (!subtopicId) return c.json({ error: 'Missing subtopic id' }, 400);

  const body = await c.req.json<{ contentMarkdown: string; published?: boolean }>();
  if (body.contentMarkdown === undefined) {
    return c.json({ error: 'Validation: contentMarkdown is required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(subtopicNotes)
    .where(eq(subtopicNotes.subtopicId, subtopicId))
    .limit(1);

  let updatedNote;
  const isPublishing = Boolean(body.published);

  if (!existing) {
    const id = crypto.randomUUID();
    const [created] = await db
      .insert(subtopicNotes)
      .values({
        id,
        subtopicId,
        contentMarkdown: body.contentMarkdown,
        published: body.published ?? false,
        publishedAt: body.published ? now : null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    updatedNote = created;
  } else {
    const [updated] = await db
      .update(subtopicNotes)
      .set({
        contentMarkdown: body.contentMarkdown,
        published: body.published !== undefined ? body.published : existing.published,
        publishedAt: body.published && !existing.published ? now : existing.publishedAt,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(eq(subtopicNotes.id, existing.id))
      .returning();

    updatedNote = updated;
  }

  // Chunking Pipeline on Publish (Section 5.1 & Milestone 5)
  let chunksGenerated = 0;
  if (isPublishing || (updatedNote && updatedNote.published)) {
    chunksGenerated = await chunkSubtopicNote(db, subtopicId, body.contentMarkdown, c.env.AI, c.env.VECTORIZE);
  }

  return c.json({ 
    note: updatedNote,
    chunksGenerated,
  });
});

export { curriculumRouter };
