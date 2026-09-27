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

const showCustomPrompt = (defaultName, codeSnippet, language) => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: '9999999', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)', fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: '#1e1e1e', color: '#fff', padding: '24px',
            borderRadius: '12px', width: '450px', border: '1px solid #333',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px'
        });

        const title = document.createElement('h2');
        title.textContent = '🎉 DSA Sync: Accepted!';
        Object.assign(title.style, { margin: '0', fontSize: '20px', fontWeight: '600', color: '#4ade80' });

        const desc = document.createElement('p');
        desc.textContent = 'Verify your submission and edit the problem name below:';
        Object.assign(desc.style, { margin: '0', fontSize: '14px', color: '#a3a3a3' });

        // Preview section
        const previewBox = document.createElement('div');
        Object.assign(previewBox.style, {
            backgroundColor: '#000', padding: '12px', borderRadius: '8px',
            border: '1px solid #333', maxHeight: '150px', overflowY: 'auto',
            fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: '#d1d5db', whiteSpace: 'pre-wrap'
        });
        
        let displayCode = codeSnippet || "No code found";
        if (displayCode.length > 300) displayCode = displayCode.substring(0, 300) + '\n\n... (truncated)';
        previewBox.innerHTML = `<strong>Language:</strong> <span style="color:#60a5fa">${language}</span><br/><br/><strong>Extracted Code:</strong><br/>${displayCode}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultName;
        Object.assign(input.style, {
            padding: '10px 12px', borderRadius: '6px', border: '1px solid #333',
            backgroundColor: '#000', color: '#fff', fontSize: '14px', outline: 'none'
        });
        input.onfocus = () => input.style.border = '1px solid #4ade80';
        input.onblur = () => input.style.border = '1px solid #333';

        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        Object.assign(cancelBtn.style, {
            padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#333',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
        });
        cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#444';
        cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#333';

        const syncBtn = document.createElement('button');
        syncBtn.textContent = 'Sync to GitHub';
        Object.assign(syncBtn.style, {
            padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e',
            color: '#000', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        });
        syncBtn.onmouseover = () => syncBtn.style.backgroundColor = '#16a34a';
        syncBtn.onmouseout = () => syncBtn.style.backgroundColor = '#22c55e';

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(syncBtn);
        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(previewBox);
        modal.appendChild(input);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        input.focus();
        input.select();

        const close = (result) => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            resolve(result);
        };

        cancelBtn.onclick = () => close(null);
        syncBtn.onclick = () => close(input.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') close(input.value);
            if (e.key === 'Escape') close(null);
        };
    });
};

const attemptCodeforcesSync = async () => {
    if (!window.location.pathname.includes('/submission/')) return false;
    
    const verdictElement = document.querySelector('.verdict-accepted');
    if (!verdictElement) return false; 

    const codeElement = document.getElementById('program-source-text');
    if (!codeElement) return false;
    const code = codeElement.innerText;

    let questionName = 'unknown-problem';
    let questionId = '0000';
    let lang = 'cpp';

    const problemLink = document.querySelector('a[href*="/problem/"]');
    
    if (problemLink) {
        const fullText = problemLink.textContent.trim();
        const match = fullText.match(/^([A-Z0-9]+)\s*-\s*(.*)/);
        if (match) {
            questionId = match[1];
            questionName = match[2].trim();
        } else {
            questionName = fullText;
        }

        const problemCell = problemLink.closest('td');
        if (problemCell && problemCell.nextElementSibling) {
            lang = problemCell.nextElementSibling.textContent.trim();
        }
    }

    const userProvidedName = await showCustomPrompt(`${questionId}_${questionName}`, code, lang);
    
    if (userProvidedName === null) {
        console.log("DSA Sync: Sync cancelled by user.");
        return false;
    }
    
    const finalQuestionName = userProvidedName.trim() || questionName;

    const payload = {
        platform: 'codeforces',
        questionId: questionId,
        questionName: finalQuestionName,
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

if (!window.hasSyncedCodeforces) {
    attemptCodeforcesSync().then(res => {
        if (res) window.hasSyncedCodeforces = true;
    });
}

setInterval(async () => {
    const codeElement = document.getElementById('program-source-text');
    const verdictElement = document.querySelector('.verdict-accepted');
    
    if (codeElement && verdictElement && !window.hasSyncedCodeforces) {
        window.hasSyncedCodeforces = true; // Set early to prevent multiple prompts while waiting
        const code = codeElement.innerText;
        
        let questionName = 'codeforces-problem';
        let lang = 'cpp';
        let questionId = '0000';
        
        const sourceLink = document.querySelector('.source-and-history a');
        if (sourceLink) {
            questionName = `submission_${sourceLink.textContent.trim()}`;
        }

        const allAccepted = document.querySelectorAll('.verdict-accepted');
        if (allAccepted.length > 0) {
            const row = allAccepted[0].closest('tr');
            if (row) {
                const probLink = row.querySelector('a[href*="/problem/"]');
                if (probLink) {
                    const fullText = probLink.textContent.trim();
                    const match = fullText.match(/^([A-Z0-9]+)\s*-\s*(.*)/);
                    if (match) {
                        questionId = match[1];
                        questionName = match[2].trim();
                    } else {
                        questionName = fullText;
                    }
                    
                    const problemCell = probLink.closest('td');
                    if (problemCell && problemCell.nextElementSibling) {
                        lang = problemCell.nextElementSibling.textContent.trim();
                    }
                }
            }
        }

        const userProvidedName = await showCustomPrompt(`${questionId}_${questionName}`, code, lang);
        
        if (userProvidedName === null) {
            console.log("DSA Sync: Sync cancelled by user.");
            return;
        }
        
        const finalQuestionName = userProvidedName.trim() || questionName;

        const payload = {
            platform: 'codeforces',
            questionId: questionId,
            questionName: finalQuestionName,
            code: code,
            ext: getExtension(lang)
        };

        chrome.runtime.sendMessage({ type: 'SYNC_SUBMISSION', payload: payload }, (response) => {
            if (!chrome.runtime.lastError) {
                console.log("DSA Sync Response:", response);
            }
        });
    }
}, 2000);
