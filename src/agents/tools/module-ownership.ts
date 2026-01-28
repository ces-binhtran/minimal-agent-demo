import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { createScopedLogger } from '../../lib/logger';

const logger = createScopedLogger('ModuleOwnershipTool');

interface ModuleOwnershipInput {
  moduleName?: string;
  module_name?: string;
  module?: string;
  filePath?: string;
  file_path?: string;
  repoId: string;
  repo_id?: string;
  files?: Array<{ path: string }>;
}

interface ModuleOwnershipOutput {
  status: 'success' | 'error';
  message: string;
  data: any | null;
}

export const moduleOwnershipTool = new FunctionTool({
  name: 'get_module_ownership',
  description: 'Analyzes knowledge ownership across a module. Can take a module name or a specific file path (which will be resolved to its containing module).',
  inputSchema: z.object({
    moduleName: z.string().optional().describe('The name of the module to analyze'),
    filePath: z.string().optional().describe('A file path to resolve to a module'),
    repoId: z.string().describe('The repository ID to analyze'),
    files: z.array(z.object({
      path: z.string().describe('File path'),
    })).optional().describe('Optional list of all files in the repository to resolve modules from'),
  }),
  execute: async (input: ModuleOwnershipInput): Promise<ModuleOwnershipOutput> => {
    try {
      let moduleName = input.moduleName || input.module_name || input.module;
      const filePath = input.filePath || input.file_path;
      const repoId = input.repoId || input.repo_id;

      logger.info({ input }, 'EXECUTE called (MOCK)');

      if (!repoId) {
        return {
          status: 'error',
          message: 'Repository ID is required',
          data: null,
        };
      }

      // Mock Data Response
      // If filePath is main.ts or similar, pretend it's in "core"
      // If moduleName is provided, use that.

      const effectiveModuleName = moduleName || (filePath ? 'core' : 'unknown-module');
      const displayName = effectiveModuleName.charAt(0).toUpperCase() + effectiveModuleName.slice(1);

      const mockOwners = [
        {
          email: "alice@example.com",
          full_name: "Alice Developer",
          averageOwnership: 0.85,
          filesContributed: 42,
          role: "maintainer"
        },
        {
          email: "bob@example.com",
          full_name: "Bob Engineer",
          averageOwnership: 0.12,
          filesContributed: 8,
          role: "contributor"
        }
      ];

      return {
        status: 'success',
        message: `Found ownership data for module "${displayName}" (MOCK)`,
        data: {
          module: effectiveModuleName,
          displayName: displayName,
          matchType: 'mock',
          architecture: 'feature-based',
          zone: 'backend',
          technology: 'typescript',
          strategyUsed: 'mock-strategy',
          fileCount: 50,
          fileTypes: ['ts', 'tsx'],
          riskLevel: 'low',
          recommendedActions: ['Knowledge is well-distributed.'],
          moduleOwners: mockOwners,
          ess: 0.9,
          confidence: 'High',
          summary: `Module "${displayName}" has Low risk with 2 owners. Primary owner is Alice Developer (85.0%).`,
        },
      };

    } catch (error: any) {
      logger.error({ err: error }, 'Error in get_module_ownership tool');
      return {
        status: 'error',
        message: `Error analyzing module ownership: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  },
});
