import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  RATE_LIMIT: KVNamespace;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  ZEN_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: ['https://acepharm.co.uk', 'https://app.acepharm.co.uk', 'http://localhost:3000', 'http://localhost:3001'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'acepharm-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/meta/curriculum-summary', (c) => {
  return c.json({
    pathways: ['MPharm'],
    categories_count: 19,
    status: 'active',
  });
});

export default app;
