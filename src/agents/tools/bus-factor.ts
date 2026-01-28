import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { createScopedLogger } from '../../lib/logger';

const logger = createScopedLogger('BusFactorTool');

interface BusFactorInput {
  repoId: string;
}

interface BusFactorOutput {
  status: 'success' | 'error';
  message: string;
  data: any | null;
}

export const busFactorTool = new FunctionTool({
  name: 'get_bus_factor',
  description: 'Calculates the bus factor (minimum developers needed to keep the codebase functional). Shows which developers are critical to the repository and what would happen if they left.',
  inputSchema: z.object({
    repoId: z.string().describe('The repository ID to analyze'),
  }),
  execute: async (input: BusFactorInput): Promise<BusFactorOutput> => {
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
      const busFactor = 2;
      const criticalDevelopers = [
        {
          developer: "Alice Developer",
          totalOwnership: 0.65,
          criticalModules: ["auth", "core"],
          criticalModuleCount: 2
        }
      ];

      return {
        status: 'success',
        message: `Bus factor analysis complete for repository ${repoId} (MOCK)`,
        data: {
          repoId,
          busFactor: busFactor,
          riskPercentage: 45,
          totalFiles: 120,
          atRiskModules: 3,
          criticalDevelopers: criticalDevelopers,
          orphanedModules: [],
          summary: `Bus factor is ${busFactor}. If the top ${busFactor} developer(s) left, 3 modules would lose coverage.`,
          recommendation: 'CRITICAL: Consider knowledge transfer and documentation',
        },
      };

    } catch (error: any) {
      logger.error({ err: error }, 'Error calculating bus factor');
      return {
        status: 'error',
        message: `Error calculating bus factor: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  },
});
