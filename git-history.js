const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToProcess = [
    'controllers/userController.js',
    'public/script.js',
    'public/styles.css',
    'routes/userRoute.js',
    'views/index.ejs',
    '.gitignore',
    'index.js',
    'package.json'
];

let currentDate = new Date('2024-03-10T10:00:00Z');
let commitCountToday = 0;
let totalCommits = 0;

function run(cmd) {
    execSync(cmd, { stdio: 'inherit' });
}

function commit(message) {
    commitCountToday++;
    totalCommits++;
    // more than 20, max 30. Let's do 25 commits per day.
    if (commitCountToday > 25) {
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
    // 1. Init git
    if (!fs.existsSync('.git')) {
        run('git init');
        run('git remote add origin https://github.com/ajmalfaris11/image_converter.git');
        run('git branch -M main');
    }

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

    // 4. Finally add package-lock.json and any other files
    run('git add .');
    commit('Add package-lock.json and final touches');

    console.log(`Finished creating ${totalCommits} commits.`);
} catch (error) {
    console.error('Error occurred:', error.message);
}
