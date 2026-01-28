import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import pool from '../../lib/db';
import { calculateBusFactor } from '../../services/risk/busFactor.js';
import { ModuleResolver } from '../../services/modules/moduleResolver.js';

/**
 * @typedef {Object} RepositorySummaryInput
 * @property {string} repoId - The repository ID
 */

/**
 * @typedef {Object} RepositorySummaryOutput
 * @property {string} status - 'success' or 'error'
 * @property {string} message - Status message
 * @property {Object|null} data - Result data with repository summary details
 */

/**
 * Repository Summary Tool
 * Provides a high-level overview of the repository state
 */
export const repositorySummaryTool = new FunctionTool({
  name: 'get_repository_summary',
  description: 'Provides a high-level summary of the repository including total files, module count, developer count, and an overall risk score. Ideal for getting an initial overview of a codebase.',
  inputSchema: z.object({
    repoId: z.string().describe('The repository ID to summarize'),
  }),
  execute: async (input) => {
    try {
      const repoId = input.repoId;
      if (!repoId || typeof repoId !== 'string') {
        return {
          status: 'error',
          message: 'Invalid repository ID provided',
          data: null,
        };
      }

      // 1. Fetch total files and developers from database
      const [fileRows] = await pool.query(`
        SELECT COUNT(DISTINCT cf.file_path) as totalFiles
        FROM commit_files cf
        JOIN commits c ON cf.commit_sha = c.sha
        JOIN repo_commits rc ON c.sha = rc.commit_sha
        WHERE rc.repo_id = ?
      `, [repoId]);

      const [devRows] = await pool.query(`
        SELECT COUNT(DISTINCT c.author_id) as totalDevelopers
        FROM commits c
        JOIN repo_commits rc ON c.sha = rc.commit_sha
        WHERE rc.repo_id = ?
      `, [repoId]);

      const totalFiles = fileRows[0]?.totalFiles || 0;
      const totalDevelopers = devRows[0]?.totalDevelopers || 0;

      // 2. Resolve modules
      const [pathRows] = await pool.query(`
        SELECT DISTINCT CONVERT(cf.file_path USING utf8) as path
        FROM commit_files cf
        JOIN commits c ON cf.commit_sha = c.sha
        JOIN repo_commits rc ON c.sha = rc.commit_sha
        WHERE rc.repo_id = ?
      `, [repoId]);

      const files = pathRows.map(r => ({ path: r.path }));
      const resolver = new ModuleResolver();
      const moduleResult = await resolver.resolveModules(files);

      // 3. Calculate Bus Factor for risk assessment
      const busFactorResult = await calculateBusFactor(repoId);

      // 4. Determine overall risk score (0-100)
      // Heuristic: bus factor weight + orphaned modules weight + risk percentage
      let riskScore = 0;
      if (busFactorResult.bus_factor <= 1) riskScore += 40;
      else if (busFactorResult.bus_factor <= 2) riskScore += 20;

      riskScore += Math.min(busFactorResult.risk_percentage, 40);
      riskScore += Math.min((busFactorResult.orphaned_modules?.length || 0) * 10, 20);

      return {
        status: 'success',
        message: `Successfully summarized repository ${repoId}`,
        data: {
          repoId,
          totalFiles,
          totalDevelopers,
          moduleCount: moduleResult.module_count,
          architecture: moduleResult.architecture,
          busFactor: busFactorResult.bus_factor,
          riskScore: Math.min(riskScore, 100),
          riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
          topRiskModules: busFactorResult.orphaned_modules || [],
          summary: `Repository has ${totalFiles} files across ${moduleResult.module_count} modules, maintained by ${totalDevelopers} developers. Overall risk score is ${riskScore}/100.`,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error summarizing repository: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  },
});
