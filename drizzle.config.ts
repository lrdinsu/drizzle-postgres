import 'dotenv/config';
import { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: 'drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
