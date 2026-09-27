console.log("DSA Sync: Codeforces listener active.");

const getExtension = (lang) => {
    lang = lang ? lang.toLowerCase() : '';
    if (lang.includes('python') || lang.includes('pypy')) return '.py';
    if (lang.includes('java')) return '.java';
    if (lang.includes('c++') || lang.includes('g++') || lang.includes('cpp')) return '.cpp';
    if (lang.includes('c#')) return '.cs';
    if (lang.includes('javascript') || lang.includes('node')) return '.js';
    if (lang.includes('go')) return '.go';
    if (lang.includes('rust')) return '.rs';
    if (lang.includes('ruby')) return '.rb';
    if (lang.includes('kotlin')) return '.kt';
    return '.txt';
};

const attemptCodeforcesSync = () => {
    // Only proceed if we're on a submission page
    if (!window.location.pathname.includes('/submission/')) return false;
    
    // The verdict is usually in a specific class
    const verdictElement = document.querySelector('.verdict-accepted');
    if (!verdictElement) return false; // Not accepted or still running

    // Extract code
    const codeElement = document.getElementById('program-source-text');
    if (!codeElement) return false;
    const code = codeElement.innerText;

    // Extract problem name and ID from the table
    const problemCell = document.querySelector('td.status-party-cell + td');
    let questionName = 'unknown-problem';
    let questionId = '0000';

    if (problemCell) {
        const problemLink = problemCell.querySelector('a');
        if (problemLink) {
            questionName = problemLink.textContent.trim();
            const match = questionName.match(/^([A-Z0-9]+)\s*-\s*(.*)/);
            if (match) {
                questionId = match[1];
                questionName = match[2].trim();
            }
        }
    }

    // Extract language
    const langCell = document.querySelector('td.status-party-cell + td + td');
    let lang = 'cpp';
    if (langCell) {
        lang = langCell.textContent.trim();
    }

    const payload = {
        platform: 'codeforces',
        questionId: questionId,
        questionName: questionName,
        code: code,
        ext: getExtension(lang)
    };

    chrome.runtime.sendMessage({ type: 'SYNC_SUBMISSION', payload: payload }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("DSA Sync Error:", chrome.runtime.lastError);
        } else {
            console.log("DSA Sync Response:", response);
        }
    });

    return true;
};

// Check immediately on load for submission pages
if (!window.hasSyncedCodeforces) {
    if (attemptCodeforcesSync()) {
        window.hasSyncedCodeforces = true;
    }
}

// Check periodically for modal openings on /my or /status pages
setInterval(() => {
    const codeElement = document.getElementById('program-source-text');
    const verdictElement = document.querySelector('.verdict-accepted');
    
    if (codeElement && verdictElement && !window.hasSyncedCodeforces) {
        // Modal is open with accepted solution, try to parse it
        const code = codeElement.innerText;
        
        // When in a modal, finding the problem name and lang is trickier 
        // because the table is on the main page. But we can usually find it from the row that was clicked.
        // We'll just grab the active submission ID from the URL or state if possible, 
        // or just rely on a simpler fallback for the modal.
        
        let questionName = 'codeforces-problem';
        let lang = 'cpp';
        
        // Try to get info from the source window if we can
        const sourceLink = document.querySelector('.source-and-history a');
        if (sourceLink) {
            questionName = `submission_${sourceLink.textContent.trim()}`;
        }

        const payload = {
            platform: 'codeforces',
            questionId: '0000',
            questionName: questionName,
            code: code,
            ext: getExtension(lang)
        };

        chrome.runtime.sendMessage({ type: 'SYNC_SUBMISSION', payload: payload }, (response) => {
            if (!chrome.runtime.lastError) {
                console.log("DSA Sync Response:", response);
            }
        });
        window.hasSyncedCodeforces = true;
    }
}, 2000);
