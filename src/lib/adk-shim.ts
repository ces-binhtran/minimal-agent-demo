import { z } from 'zod';

export class FunctionTool {
    name: string;
    description: string;
    inputSchema: z.ZodSchema<any>;
    execute: (input: any) => Promise<any>;

    constructor(config: {
        name: string;
        description: string;
        inputSchema: z.ZodSchema<any>;
        execute: (input: any) => Promise<any>;
    }) {
        this.name = config.name;
        this.description = config.description;
        this.inputSchema = config.inputSchema;
        this.execute = config.execute;
    }
}
