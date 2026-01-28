import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Config', () => {
    it('should validate correct environment variables', () => {
        const schema = z.object({
            APP_PORT: z.string().default('3000').transform(val => parseInt(val, 10)).pipe(z.number()),
        });

        const result = schema.safeParse({ APP_PORT: '5000' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.APP_PORT).toBe(5000);
        }
    });

    it('should use default values', () => {
        const schema = z.object({
            APP_PORT: z.string().default('3000').transform(val => parseInt(val, 10)).pipe(z.number()),
        });

        const result = schema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.APP_PORT).toBe(3000);
        }
    });
});
