class SimpleCache {
    private cache: Map<string, any>;
    private ttl: Map<string, number>;
    private stdTTL: number;

    constructor(options: { stdTTL?: number } = {}) {
        this.cache = new Map();
        this.ttl = new Map();
        this.stdTTL = options.stdTTL || 0;
    }

    set(key: string, value: any, ttl?: number): boolean {
        this.cache.set(key, value);
        // Simplified TTL (ignored for demo or just basic)
        return true;
    }

    get(key: string): any {
        return this.cache.get(key);
    }
}

const globalForCache = global as unknown as { cache: SimpleCache };

export const cache = globalForCache.cache || new SimpleCache({
    stdTTL: 21600
});

export const MODULE_TTL = 86400;

if (process.env.NODE_ENV !== 'production') {
    globalForCache.cache = cache;
}
