import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: 'b3ae5b86-7cdb-4c4a-b966-c64a0caef376',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
});
