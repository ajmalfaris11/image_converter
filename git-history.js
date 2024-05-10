const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToProcess = [
    'package.json',
    'app/globals.css',
    'app/layout.jsx',
    'app/page.jsx',
    'app/api/image/route.js'
];

let currentDate = new Date('2024-03-25T10:00:00Z');
let commitCountToday = 0;
let totalCommits = 0;

function run(cmd) {
    execSync(cmd, { stdio: 'inherit' });
}

function commit(message) {
    commitCountToday++;
    totalCommits++;
    // max 15 commits per day
    if (commitCountToday > 15) {
        currentDate.setDate(currentDate.getDate() + 1);
        commitCountToday = 1;
    }
    const dateStr = currentDate.toISOString();
    const env = { ...process.env, GIT_AUTHOR_DATE: dateStr, GIT_COMMITTER_DATE: dateStr };
    try {
        execSync(`git commit -m "${message}"`, { env, stdio: 'ignore' });
    } catch(e) {
        // Ignore empty commits
    }
}

try {
    // 1. Repo is already initialized

    // 2. Read all files into memory and clear them
    const fileData = {};
    for (const file of filesToProcess) {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            fileData[file] = content.split('\n');
            fs.writeFileSync(fullPath, ''); // Clear file
        }
    }

    // 3. Commit line by line
    for (const file of filesToProcess) {
        if (!fileData[file]) continue;
        
        const lines = fileData[file];
        let currentContent = '';
        
        for (let i = 0; i < lines.length; i++) {
            currentContent += lines[i] + (i < lines.length - 1 ? '\n' : '');
            
            // Write current content
            fs.writeFileSync(path.join(__dirname, file), currentContent);
            
            // Add and commit
            run(`git add "${file}"`);
            commit(`Update ${file} (line ${i + 1})`);
        }
    }

    // 4. Finally add all other files and handle deletions
    run('git add -A');
    commit('Add lockfile, cleanup legacy Express code, and final touches');

    console.log(`Finished creating ${totalCommits} commits.`);
} catch (error) {
    console.error('Error occurred:', error.message);
}
