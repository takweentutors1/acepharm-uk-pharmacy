# AcePharm Backend Operations Runbook

- **Scope:** Cloudflare Workers, Cloudflare D1 (SQLite), Vectorize, KV Namespaces, and R2 Storage.
- **Target Audience:** DevOps Engineers, Backend Maintainers, and Clinical Database Administrators.

---

## 1. Cloudflare D1 Database Migrations

### 1.1 Local Development Migrations
```bash
# Run local migrations with Wrangler
pnpm --filter @acepharm/api drizzle-kit generate
wrangler d1 migrations apply DB --local
```

### 1.2 Production Migrations
```bash
# Apply migrations to production Western Europe (weur) D1 instance
wrangler d1 migrations apply DB --remote
```

### 1.3 Seeding the Clinical Question Bank
```bash
# Execute the verified 135-question clinical seed script
wrangler d1 execute DB --remote --file=seed_135.sql
```

---

## 2. Cloudflare Vectorize Embedding Indexing

When clinical questions, BNF subtopics, or rationales are updated in D1, the Vectorize index must be synchronized:

```bash
# Embed all content_chunks using @cf/baai/bge-base-en-v1.5 and upsert to Vectorize
pnpm --filter @acepharm/api run vectorize:sync
```

### Vector Index Parameters:
- **Dimensions:** 768
- **Metric:** `cosine`
- **Model:** `@cf/baai/bge-base-en-v1.5` (Workers AI)

---

## 3. Stripe Webhook & Secret Management

### 3.1 Local Webhook Testing
```bash
stripe listen --forward-to localhost:8787/api/v1/stripe/webhook
```

### 3.2 Production Secret Rotation
To update production API keys and Stripe signing secrets:
```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put ZEN_API_KEY
```

---

## 4. Disaster Recovery & R2 Snapshots

1. **Automated Daily Backups:** D1 tables are dumped to `.sql.gz` archives and stored in Cloudflare R2 bucket `ASSETS/backups/`.
2. **Point-In-Time Restoration:**
```bash
# Download latest backup from R2
wrangler r2 object get acepharm-assets/backups/d1-backup-latest.sql d1-restore.sql

# Restore to D1
wrangler d1 execute DB --remote --file=d1-restore.sql
```
