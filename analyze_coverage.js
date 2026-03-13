const fs = require('fs');
const path = require('path');

const regressionFile = 'O2C Regression.txt';
const testsDir = 'tests';

let regressionData = fs.readFileSync(regressionFile);
let text = regressionData.toString('utf16le');
if (!text.includes('Scenario')) {
    text = regressionData.toString('utf8');
}

const lines = text.split('\n');
const expectedScenarios = {};

for (const line of lines) {
    if (!line.trim() || !line.includes('Scenario')) continue;
    const match = line.match(/Scenario\s*(\d+)/i);
    if (match) {
        const num = match[1];
        if (!expectedScenarios[num]) {
            expectedScenarios[num] = {
                id: num,
                text: line.trim()
            };
        }
    }
}

const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.ts'));
const coveredScenarios = {};
const partialScenarios = {};

for (const file of testFiles) {
    const filePath = path.join(testsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fileLines = content.split('\n');
    
    // Track which scenarios are covered in this file
    const scenariosInFile = new Set();
    const regex = /Scenario\s*(\d+)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const num = match[1];
        if (!coveredScenarios[num]) {
            coveredScenarios[num] = new Set();
        }
        coveredScenarios[num].add(file);
        scenariosInFile.add(num);
    }

    // Check line by line for incompletion relating to specific scenarios
    for (const [index, f_line] of fileLines.entries()) {
        const incompleteMatch = f_line.match(/INCOMPLETE|TODO:|console\.warn/i);
        if (incompleteMatch) {
            // Find which scenario this line applies to (look at current line and next/prev few lines)
            const contextStart = Math.max(0, index - 5);
            const contextEnd = Math.min(fileLines.length, index + 5);
            const context = fileLines.slice(contextStart, contextEnd).join('\n');
            
            const numMatch = context.match(/Scenario\s*(\d+)/i);
            if (numMatch) {
                const num = numMatch[1];
                if (!partialScenarios[num]) {
                    partialScenarios[num] = new Set();
                }
                partialScenarios[num].add(file + ` (Line ${index+1}: ` + f_line.trim() + `)`);
            }
        }
    }
}

console.log('\\n--- PARTIAL REASONS ---');
for (const [num, reasons] of Object.entries(partialScenarios)) {
    console.log(`Scenario ${num}:`);
    for (const r of reasons) {
        console.log(`  - ${r}`);
    }
}

// Recalculate status
const status = {
    totalExpected: Object.keys(expectedScenarios).length,
    covered: [],
    partial: [],
    missing: [],
    mapping: {}
};

for (const num of Object.keys(expectedScenarios).sort((a,b)=>parseInt(a)-parseInt(b))) {
    if (coveredScenarios[num]) {
        if (partialScenarios[num]) {
            status.partial.push(num);
        } else {
            status.covered.push(num);
        }
        status.mapping[num] = [...coveredScenarios[num]];
    } else {
        status.missing.push(num);
    }
}

console.log(`\\n--- RECALCULATED SUMMARY ---`);
console.log(`Total Expected: ${status.totalExpected}`);
console.log(`Fully Covered: ${status.covered.length}`);
console.log(`Partially Covered: ${status.partial.length}`);
console.log(`Missing: ${status.missing.length}`);

fs.writeFileSync('coverage.json', JSON.stringify(status, null, 2));

