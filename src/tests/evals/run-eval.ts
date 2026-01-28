import { intentParserNode } from "../../agents/langgraph/nodes";
import { AgentState } from "../../agents/langgraph/state";
import { HumanMessage } from "@langchain/core/messages";
import fs from 'fs';
import path from 'path';

async function runEvals() {
    const datasetPath = path.join(__dirname, 'dataset.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    console.log(`Running ${dataset.length} evaluation cases...`);

    let passed = 0;

    for (const testCase of dataset) {
        console.log(`\nTest Case ${testCase.id}: "${testCase.query}"`);

        // Mock State
        const state = {
            messages: [new HumanMessage(testCase.query)],
            toolResults: {},
            repoId: 'test-repo'
        };

        try {
            // Test Intent Parser specifically (as it's the router)
            const result = await intentParserNode(state as any);
            const intent = result.intent;

            let matches = true;

            // Check Intent Type
            if (intent.type !== testCase.expected_intent) {
                console.error(`  ❌ Intent Mismatch: Expected '${testCase.expected_intent}', Got '${intent.type}'`);
                matches = false;
            } else {
                console.log(`  ✅ Intent match: ${intent.type}`);
            }

            // Check Entities
            if (testCase.expected_entities) {
                for (const [key, value] of Object.entries(testCase.expected_entities)) {
                    if (intent.entities[key] !== value) {
                        console.error(`  ❌ Entity Mismatch [${key}]: Expected '${value}', Got '${intent.entities[key]}'`);
                        matches = false;
                    }
                }
            }

            if (matches) passed++;

        } catch (e) {
            console.error(`  ❌ Error:`, e);
        }
    }

    console.log(`\n------------------------------------------------`);
    console.log(`Evaluation Complete. Score: ${passed}/${dataset.length} (${(passed / dataset.length) * 100}%)`);
    console.log(`------------------------------------------------`);
}

runEvals().catch(console.error);
