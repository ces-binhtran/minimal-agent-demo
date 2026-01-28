import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export class PromptManager {
    private static instance: PromptManager;
    private promptsDir: string;
    private cache: Map<string, string> = new Map();

    private constructor() {
        this.promptsDir = path.join(process.cwd(), 'src', 'prompts');
    }

    public static getInstance(): PromptManager {
        if (!PromptManager.instance) {
            PromptManager.instance = new PromptManager();
        }
        return PromptManager.instance;
    }

    /**
     * Loads a prompt from a YAML file and substitutes variables.
     * @param promptName The name of the YAML file (without extension)
     * @param variables A map of variable names to values
     * @returns The rendered prompt string
     */
    public load(promptName: string, variables: Record<string, any> = {}): string {
        try {
            let template = this.cache.get(promptName);

            if (!template) {
                const filePath = path.join(this.promptsDir, `${promptName}.yaml`);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsed = yaml.load(fileContent) as { template: string };
                if (!parsed || !parsed.template) {
                    throw new Error(`Invalid prompt file: ${promptName}.yaml. Missing 'template' key.`);
                }
                template = parsed.template;
                // Only cache in production to allow hot-reloading in dev
                if (process.env.NODE_ENV === 'production') {
                    this.cache.set(promptName, template);
                }
            }

            return this.render(template, variables);
        } catch (error) {
            console.error(`Failed to load prompt '${promptName}':`, error);
            throw error;
        }
    }

    private render(template: string, variables: Record<string, any>): string {
        return template.replace(/\$\{(\w+)\}/g, (match, key) => {
            return variables.hasOwnProperty(key) ? String(variables[key]) : match;
        });
    }
}

export const promptManager = PromptManager.getInstance();
