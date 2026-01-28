
const { moduleOwnershipTool } = require('./src/agents/tools/module-ownership.js');
const db = require('./src/lib/db.js').default;

// Mock input that mimics what the agent *should* have sent
const input = {
    repoId: 'ces-knowledge-ownership',
    moduleName: 'src/agents',
    // Intent: User asked "Who owns src/agents?" -> likely mapped to moduleName by LLM
};

// Mock input with filePath to see if that works better
const inputFilePath = {
    repoId: 'ces-knowledge-ownership',
    filePath: 'src/agents/index.js'
};

// Mock input that triggers the error
const inputEmpty = {
    repoId: 'ces-knowledge-ownership'
};

async function run() {
    console.log('--- Test 1: Empty Input ---');
    try {
        const res = await moduleOwnershipTool.execute(inputEmpty);
        console.log('Result:', res);
    } catch (e) {
        console.error('Error:', e);
    }

    console.log('\n--- Test 2: ModuleName = src/agents ---');
    try {
        const res = await moduleOwnershipTool.execute(input);
        console.log('Result:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
