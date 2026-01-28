import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { createScopedLogger } from '../../lib/logger';

const logger = createScopedLogger('ModulesListTool');

interface ModulesListInput {
  repoId: string;
}

interface ModulesListOutput {
  status: 'success' | 'error';
  message: string;
  data: any | null;
}

export const modulesListTool = new FunctionTool({
  name: 'get_modules_list',
  description: 'Lists all detected modules/domains in the repository with their architecture type (entity-based, directory, package). Shows module names, file counts, and ownership summary.',
  inputSchema: z.object({
    repoId: z.string().describe('The repository ID to list modules for'),
  }),
  execute: async (input: ModulesListInput): Promise<ModulesListOutput> => {
    try {
      const repoId = input.repoId;
      logger.info({ repoId }, 'EXECUTE called (MOCK)');

      if (!repoId || typeof repoId !== 'string') {
        return {
          status: 'error',
          message: 'Invalid repository ID provided',
          data: null,
        };
      }

      // Mock Data
      const modules = [
        {
          name: "auth",
          display_name: "Auth Service",
          category: "Service",
          fileCount: 25,
          detectionStrategy: "directory-based"
        },
        {
          name: "core",
          display_name: "Core Utils",
          category: "Library",
          fileCount: 40,
          detectionStrategy: "package-based"
        },
        {
          name: "frontend",
          display_name: "Frontend UI",
          category: "Application",
          fileCount: 150,
          detectionStrategy: "directory-based"
        }
      ];

      return {
        status: 'success',
        message: `Found ${modules.length} modules (MOCK)`,
        data: {
          repoId,
          architecture: "monorepo",
          modules: modules,
          summary: `Repository uses monorepo architecture with ${modules.length} modules (Mock data).`,
        },
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Error listing modules');
      return {
        status: 'error',
        message: `Error listing modules: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  },
});
