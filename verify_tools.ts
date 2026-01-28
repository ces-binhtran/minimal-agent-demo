
import { moduleOwnershipTool, busFactorTool, modulesListTool } from './src/agents/tools/ownership-tools';

async function verify() {
    console.log("--- Verifying Real Tools ---");

    // 1. Module Ownership (should match dummy CODEOWNERS)
    console.log("\n1. Testing moduleOwnershipTool for 'src/lib'");
    const content = await moduleOwnershipTool.execute({ module: 'src/lib' });
    console.log("Result:", JSON.stringify(content, null, 2));

    // 2. Bus Factor (should run git shortlog)
    console.log("\n2. Testing busFactorTool for 'src'");
    const bus = await busFactorTool.execute({ module: 'src' });
    console.log("Result:", JSON.stringify(bus, null, 2));

    // 3. Modules List (should list src contents)
    console.log("\n3. Testing modulesListTool");
    const list = await modulesListTool.execute({});
    console.log("Result:", JSON.stringify(list, null, 2));
}

verify().catch(console.error);
