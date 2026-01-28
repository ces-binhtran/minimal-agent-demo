import { z } from 'zod';

const envSchema = z.object({
    // Database Config
    DB_HOST: z.string().default('127.0.0.1'),
    DB_USER: z.string().default('root'),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().min(1, "DB_NAME is required"),

    // App Config
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['info', 'error', 'warn', 'debug']).default('info'),
    APP_PORT: z.string().default('3000').transform(val => parseInt(val, 10)).pipe(z.number()),

    // Feature Flags
    STRICT_DB_MODE: z.string().default('false').transform(val => val === 'true').pipe(z.boolean()), // If true, fail hard on DB errors
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    // In production, we might want to throw error. 
    // For now, in dev/demo, we might warn but maybe throwing is safer to force correct config.
    // Let's throw to be "production grade".
    throw new Error("Invalid environment variables");
}

export const env = parsed.data;
