const fs = require('fs');
const path = require('path');

const regressionFile = 'O2C Regression.txt';
const coverageFile = 'coverage.json';

// Read definitions
let regressionData = fs.readFileSync(regressionFile);
let text = regressionData.toString('utf16le');
if (!text.includes('Scenario')) {
    text = regressionData.toString('utf8');
}

const lines = text.split('\n');
const expectedScenarios = {};

for (const line of lines) {
    if (!line.trim() || !line.includes('Scenario')) continue;
    
    // Parse the TSV structure
    const columns = line.split('\t').map(c => c.trim()).filter(c => c.length > 0);
    
    let match = line.match(/Scenario\s*(\d+)/i);
    let num = match ? match[1] : null;
    if (num) {
        // Find description (usually the last column that isn't just whitespace)
        let desc = columns.length > 0 ? columns[columns.length - 1] : "No description provided.";
        
        // sanitize latex specials
        desc = desc.replace(/\\/g, '\\textbackslash{}')
                   .replace(/&/g, '\\&')
                   .replace(/%/g, '\\%')
                   .replace(/\$/g, '\\$')
                   .replace(/#/g, '\\#')
                   .replace(/_/g, '\\_')
                   .replace(/\{/g, '\\{')
                   .replace(/\}/g, '\\}')
                   .replace(/~/g, '\\textasciitilde{}')
                   .replace(/\^/g, '\\textasciicircum{}')
                   .replace(/</g, '\\textless{}')
                   .replace(/>/g, '\\textgreater{}');

        expectedScenarios[num] = {
            id: num,
            category: columns.length > 1 ? columns[1].replace(/&/g, '\\&') : "General",
            desc: desc
        };
    }
}

// Read coverage results
const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

// Generate LaTeX
let texContent = `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{libertine} % elegant font
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{tcolorbox}
\\usepackage{tabularx}
\\usepackage{pifont}

\\definecolor{statusGreen}{HTML}{4CAF50}
\\definecolor{statusYellow}{HTML}{FF9800}
\\definecolor{statusRed}{HTML}{F44336}

\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,      
    urlcolor=cyan,
    pdftitle={O2C Regression Coverage Report},
}

\\title{\\textbf{\\huge O2C Regression Automation \\\\[0.5em] Coverage Report}}
\\author{QA \\& Automation Team}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This document outlines the detailed test automation coverage of the internal O2C Regression test plan. It matches the manual test scenarios with their corresponding automated Playwright test implementations, detailing complete coverage, partial coverage, and missing coverage gaps.
\\end{abstract}

\\tableofcontents
\\newpage

\\section{Executive Summary}

The regression suite consists of \\textbf{${coverageData.totalExpected}} explicitly tracked scenarios.

\\begin{itemize}
    \\item \\textbf{\\textcolor{statusGreen}{Fully Covered:}} ${coverageData.covered.length} scenarios.
    \\item \\textbf{\\textcolor{statusYellow}{Partially Covered / In Progress:}} ${coverageData.partial.length} scenarios.
    \\item \\textbf{\\textcolor{statusRed}{Missing / Not Implemented:}} ${coverageData.missing.length} scenarios.
\\end{itemize}

\\vspace{0.5cm}

\\begin{tcolorbox}[colback=statusYellow!10!white,colframe=statusYellow!90!black,title=Note on Partial Coverage]
Scenarios demarcated as \`\`Partial'' have implementations in the Playwright test codebase, but contain either explicit \\texttt{INCOMPLETE} warning markers, console warnings about missing locators, conditionally blocked steps, or rely on external verifications that cannot currently be entirely automated (e.g., manual validation against a third-party Korber WMS).
\\end{tcolorbox}

\\newpage

\\section{Fully Covered Scenarios}
The scenarios below represent cases that are entirely automated. The scripts execute end-to-end without any missing step warnings or unimplemented actions.

\\vspace{0.3cm}
\\begin{longtable}{p{0.12\\textwidth} p{0.3\\textwidth} p{0.48\\textwidth}}
\\toprule
\\textbf{Scenario} & \\textbf{Relevant Implementation} & \\textbf{Description} \\\\
\\midrule
\\endhead
`;

for (let id of coverageData.covered) {
    let files = coverageData.mapping[id].join(', ').replace(/_/g, '\\_');
    let desc = expectedScenarios[id] ? expectedScenarios[id].desc : "No description provided.";
    texContent += `\\textbf{Sc. ${id}} & \\texttt{${files}} & ${desc} \\\\\\relax\n`;
    texContent += `\\cmidrule{1-3}\n`;
}

texContent += `\\bottomrule
\\end{longtable}

\\newpage

\\section{Partially Covered / Work In Progress}
These scenarios have associated automation code but require supplementary refinements. The current test files might be missing specific UI locators, or they hit boundaries that necessitate manual checking (such as interacting with external warehouse platforms).

\\vspace{0.3cm}
\\begin{longtable}{p{0.12\\textwidth} p{0.3\\textwidth} p{0.48\\textwidth}}
\\toprule
\\textbf{Scenario} & \\textbf{Relevant Implementation} & \\textbf{Description} \\\\
\\midrule
\\endhead
`;

for (let id of coverageData.partial) {
    let files = coverageData.mapping[id].join(', ').replace(/_/g, '\\_');
    let desc = expectedScenarios[id] ? expectedScenarios[id].desc : "No description provided.";
    texContent += `\\textbf{Sc. ${id}} & \\texttt{${files}} & ${desc} \\\\\\relax\n`;
    texContent += `\\cmidrule{1-3}\n`;
}

texContent += `\\bottomrule
\\end{longtable}

\\newpage

\\section{Missing / Not Implemented Scenarios}
The succeeding table documents the manual scenarios defined within the original test plan that possess zero coverage or references inside the current automation repository.

\\vspace{0.3cm}
\\begin{longtable}{p{0.12\\textwidth} p{0.2\\textwidth} p{0.55\\textwidth}}
\\toprule
\\textbf{Scenario} & \\textbf{Category} & \\textbf{Description} \\\\
\\midrule
\\endhead
`;

for (let id of coverageData.missing) {
    let cat = expectedScenarios[id] ? expectedScenarios[id].category : "Uncategorized";
    let desc = expectedScenarios[id] ? expectedScenarios[id].desc : "No description provided.";
    texContent += `\\textbf{Sc. ${id}} & ${cat} & ${desc} \\\\\\relax\n`;
    texContent += `\\cmidrule{1-3}\n`;
}

texContent += `\\bottomrule
\\end{longtable}

\\end{document}
`;

const reportDir = 'Overleaf_Report';
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
}
fs.writeFileSync(path.join(reportDir, 'main.tex'), texContent);
console.log('Successfully wrote main.tex.');

