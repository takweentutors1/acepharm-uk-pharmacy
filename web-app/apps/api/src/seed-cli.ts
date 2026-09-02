import { drizzle } from 'drizzle-orm/d1';
import { runMilestone2SeedPipeline } from './seed-pipeline';

export default {
  async test(env: any) {
    const result = await runMilestone2SeedPipeline(env.DB);
    console.log('Seeding result:', result);
  }
};
