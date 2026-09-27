console.log("DSA Sync: LeetCode listener active.");

const getExtension = (lang) => {
    lang = lang ? lang.toLowerCase() : '';
    if (lang.includes('python')) return '.py';
    if (lang.includes('java')) return '.java';
    if (lang.includes('c++') || lang.includes('cpp')) return '.cpp';
    if (lang.includes('c#') || lang.includes('csharp')) return '.cs';
    if (lang.includes('javascript') || lang.includes('js')) return '.js';
    if (lang.includes('typescript') || lang.includes('ts')) return '.ts';
    if (lang.includes('go')) return '.go';
    if (lang.includes('rust')) return '.rs';
    if (lang.includes('ruby')) return '.rb';
    if (lang.includes('swift')) return '.swift';
    if (lang.includes('kotlin')) return '.kt';
    return '.txt';
};

const extractLeetcodeCode = () => {
    // Attempt 1: from Monaco editor
    const lines = document.querySelectorAll('.view-lines .view-line');
    if (lines.length > 0) {
        let code = '';
        lines.forEach(line => {
            // A crude way to preserve some indentation
            code += line.textContent.replace(/\u00a0/g, ' ') + '\n';
        });
        return code;
    }
    // Attempt 2: code tags in submission details
    const codeTag = document.querySelector('code');
    if (codeTag) {
        return codeTag.innerText;
    }
    return null;
};

let hasSynced = false;

// We use an interval to poll for changes, since the DOM is highly dynamic (React)
setInterval(() => {
    // Check for success indicators
    const successElem = document.querySelector('[data-e2e-locator="submission-result"]') || document.querySelector('.text-success');
    let isAccepted = false;
    
    if (successElem && successElem.textContent.toLowerCase().includes('accepted')) {
        isAccepted = true;
    } else {
        // Fallback for older UI or different variations
        const spans = document.querySelectorAll('span, div');
        for (let el of spans) {
            if (el.textContent === 'Accepted' && (el.style.color === 'rgb(34, 197, 94)' || el.className.includes('green'))) {
                isAccepted = true;
                break;
            }
        }
    }

    if (isAccepted && !hasSynced) {
        hasSynced = true; // prevent duplicate syncs
        
        const code = extractLeetcodeCode();
        if (!code || code.trim() === '') return;

        // Extract problem name from URL
        const urlParts = window.location.pathname.split('/');
        const problemIndex = urlParts.indexOf('problems');
        const questionName = problemIndex !== -1 && problemIndex + 1 < urlParts.length ? urlParts[problemIndex + 1] : 'unknown-problem';
        
        // Find language
        const langElement = document.querySelector('[data-e2e-locator="console-language-selector"]') || document.querySelector('#lang-select');
        const lang = langElement ? langElement.textContent : 'cpp';

        const payload = {
            platform: 'leetcode',
            questionId: '0000', // Hard to extract precisely without API
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
    }
}, 2000);

// Reset sync flag when submit button is clicked
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-e2e-locator="console-submit-button"]') || e.target.closest('button');
    if (btn && btn.textContent && btn.textContent.toLowerCase().includes('submit')) {
        hasSynced = false;
    }
});
