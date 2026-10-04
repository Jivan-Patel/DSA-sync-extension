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
    if (lang.includes('sql') || lang.includes('mysql') || lang.includes('oracle')) return '.sql';
    return '.txt';
};

const isVisible = (e) => {
    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
};

const stripLineNumbers = (rawCode) => {
    if (!rawCode) return rawCode;
    const lines = rawCode.split('\n');
    let matchCount = 0;
    let expectedLine = 1;
    
    // Verify sequence pattern
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            expectedLine++;
            continue;
        }
        if (lines[i].startsWith(expectedLine.toString())) {
            matchCount++;
            expectedLine++;
        } else {
            break;
        }
    }
    
    // If it confidently looks like line numbers are baked into the string
    if (matchCount > 1 || (lines.length === 1 && matchCount === 1)) {
        let cleaned = [];
        expectedLine = 1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '') {
                cleaned.push('');
            } else if (lines[i].startsWith(expectedLine.toString())) {
                cleaned.push(lines[i].substring(expectedLine.toString().length));
            } else {
                cleaned.push(lines[i]);
            }
            expectedLine++;
        }
        return cleaned.join('\n');
    }
    return rawCode;
};

const extractLeetcodeCode = () => {
    let extractedCode = null;
    const submissionPanel = document.querySelector('[data-e2e-locator="submission-detail"]');
    const editorContainer = submissionPanel ? submissionPanel : document;
    
    const viewLinesList = editorContainer.querySelectorAll('.view-lines');
    if (viewLinesList.length > 0) {
        const targetEditor = viewLinesList[viewLinesList.length - 1];
        const lines = targetEditor.querySelectorAll('.view-line');
        let code = '';
        lines.forEach(line => {
            code += line.textContent.replace(/\u00a0/g, ' ') + '\n';
        });
        if (code.trim().length > 1) {
            extractedCode = code.trimEnd();
        }
    }
    
    if (!extractedCode) {
        const codeBlocks = document.querySelectorAll('pre code');
        if (codeBlocks.length > 0) {
            extractedCode = codeBlocks[codeBlocks.length - 1].innerText.trimEnd();
        }
    }
    
    return stripLineNumbers(extractedCode);
};

const showToast = (message, isError = false) => {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
        position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999999',
        backgroundColor: isError ? '#ef4444' : '#22c55e', color: '#fff',
        padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: '500',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateY(20px)', opacity: '0'
    });
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }, 300);
    }, 4000);
};

const showConfirmPrompt = (message) => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: '9999999', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)', fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: '#1e1e1e', color: '#fff', padding: '24px',
            borderRadius: '12px', width: '400px', border: '1px solid #ef4444',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px'
        });

        const title = document.createElement('h2');
        title.textContent = '⚠️ Overwrite Warning';
        Object.assign(title.style, { margin: '0', fontSize: '18px', fontWeight: '600', color: '#ef4444' });

        const desc = document.createElement('p');
        desc.textContent = message;
        Object.assign(desc.style, { margin: '0', fontSize: '14px', color: '#d1d5db', lineHeight: '1.5', whiteSpace: 'pre-wrap' });

        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        Object.assign(cancelBtn.style, {
            padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#333',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
        });

        const overwriteBtn = document.createElement('button');
        overwriteBtn.textContent = 'Overwrite';
        Object.assign(overwriteBtn.style, {
            padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444',
            color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        });

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(overwriteBtn);
        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = (result) => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            resolve(result);
        };

        cancelBtn.onclick = () => close(false);
        overwriteBtn.onclick = () => close(true);
    });
};

const syncWithConfirm = (payload) => {
    chrome.runtime.sendMessage({ type: 'CHECK_EXISTS', payload: payload }, async (response) => {
        if (response && response.exists) {
            const confirm = await showConfirmPrompt(`A solution for "${payload.questionName}" already exists on your GitHub.\n\nDo you want to overwrite it?`);
            if (!confirm) {
                showToast("Sync cancelled.", false);
                return;
            }
        }
        
        chrome.runtime.sendMessage({ type: 'SYNC_SUBMISSION', payload: payload }, (syncResp) => {
            if (chrome.runtime.lastError) {
                showToast("Extension Error: " + chrome.runtime.lastError.message, true);
            } else if (syncResp && syncResp.success) {
                showToast(syncResp.message || "Successfully pushed to GitHub!");
            } else {
                showToast(syncResp ? syncResp.message : "Unknown error occurred", true);
            }
        });
    });
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
            borderRadius: '12px', width: '500px', border: '1px solid #333',
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
            border: '1px solid #333', maxHeight: '80vh', overflowY: 'auto',
            fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: '#d1d5db', whiteSpace: 'pre-wrap'
        });
        
        let displayCode = codeSnippet || "No code found";
        if (displayCode.length > 300) displayCode = displayCode.substring(0, 300);
        previewBox.innerHTML = `<strong>Language:</strong> <span style="color:#60a5fa">${language}</span><br/><br/><strong>Extracted Code:</strong><br /><br />${displayCode}`;

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

let hasSynced = false;

setInterval(async () => {
    let isAccepted = false;
    
    const submissionResult = document.querySelector('[data-e2e-locator="submission-result"]');
    if (submissionResult && isVisible(submissionResult)) {
        if (submissionResult.textContent.toLowerCase().includes('accepted')) {
            isAccepted = true;
        }
    } else {
        const spans = document.querySelectorAll('span, div');
        for (let i = 0; i < spans.length; i++) {
            const el = spans[i];
            if (el.textContent === 'Accepted' && isVisible(el)) {
                if (el.style.color === 'rgb(34, 197, 94)' || el.className.includes('green') || el.className.includes('success')) {
                    if (el.closest('[data-e2e-locator="console-result"]')) continue;
                    
                    let parent = el.parentElement;
                    let levels = 0;
                    let foundSubmissionIndicators = false;
                    while (parent && levels < 5) {
                        if (parent.textContent.includes('Runtime') || parent.textContent.includes('Memory') || parent.textContent.includes('Submitted')) {
                            foundSubmissionIndicators = true;
                            break;
                        }
                        parent = parent.parentElement;
                        levels++;
                    }
                    
                    if (foundSubmissionIndicators) {
                        isAccepted = true;
                        break;
                    }
                }
            }
        }
    }

    if (isAccepted && !hasSynced) {
        hasSynced = true; 
        
        const code = extractLeetcodeCode();
        if (!code || code.trim() === '' || code.trim() === '#') {
            console.log("DSA Sync: No code extracted, skipping sync.");
            hasSynced = false; 
            return;
        }

        const urlParts = window.location.pathname.split('/');
        const problemIndex = urlParts.indexOf('problems');
        let questionSlug = problemIndex !== -1 && problemIndex + 1 < urlParts.length ? urlParts[problemIndex + 1] : 'unknown-problem';
        
        let questionId = '0000';
        let questionName = questionSlug;

        const titleLinks = document.querySelectorAll('a, div, h1, h2, h3');
        for (let i = 0; i < titleLinks.length; i++) {
            const text = titleLinks[i].textContent.trim();
            const match = text.match(/^(\d+)\.\s+(.*)/);
            if (match) {
                const nameSlug = match[2].toLowerCase().replace(/[^a-z0-9]/g, '');
                const urlSlug = questionSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (nameSlug === urlSlug || urlSlug.includes(nameSlug)) {
                    questionId = match[1].padStart(4, '0');
                    questionName = match[2].replace(/\s+/g, '_'); 
                    break;
                }
            }
        }

        let lang = 'cpp';
        const allButtons = document.querySelectorAll('button, div[role="button"]');
        const knownLangs = ['C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Go', 'Ruby', 'Scala', 'Rust', 'Erlang', 'Elixir', 'MySQL', 'MS SQL Server', 'Oracle', 'Pandas', 'PostgreSQL'];
        for (let i = 0; i < allButtons.length; i++) {
            const txt = allButtons[i].textContent.trim();
            if (knownLangs.includes(txt)) {
                lang = txt;
                break;
            }
        }

        const userProvidedName = await showCustomPrompt(`${questionId}_${questionName}`, code, lang);
        
        if (userProvidedName === null) {
            console.log("DSA Sync: Sync cancelled by user.");
            return;
        }
        
        const finalQuestionName = userProvidedName.trim() || `${questionId}_${questionName}`;

        const payload = {
            platform: 'leetcode',
            questionId: questionId,
            questionName: finalQuestionName,
            code: code,
            ext: getExtension(lang)
        };

        syncWithConfirm(payload);
    }
}, 2000);

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-e2e-locator="console-submit-button"]') || e.target.closest('button');
    if (btn && btn.textContent && btn.textContent.toLowerCase().includes('submit')) {
        hasSynced = false;
    }
});
