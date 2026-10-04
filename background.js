chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SYNC_SUBMISSION') {
        syncToGitHub(request.payload).then(res => {
            sendResponse({success: res.success, message: res.message});
        });
        return true; 
    }
    if (request.type === 'CHECK_EXISTS') {
        checkExists(request.payload).then(res => sendResponse(res));
        return true;
    }
});

async function checkExists(data) {
    const res = await chrome.storage.local.get(['ghToken', 'repoName']);
    if (!res.ghToken || !res.repoName) return { exists: false };
    
    let path = '';
    if (data.platform === 'leetcode') {
        path = `leetcode/${data.questionName.replace(/\s+/g, '_')}/solution${data.ext}`;
    } else if (data.platform === 'codeforces') {
        path = `codeforces/${data.questionName.replace(/\s+/g, '_')}/solution${data.ext}`;
    }

    const apiUrl = `https://api.github.com/repos/${res.repoName}/contents/${path}`;
    try {
        const getRes = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${res.ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        return { exists: getRes.status === 200 };
    } catch (e) {
        return { exists: false };
    }
}

async function syncToGitHub(data) {
    // data contains: { platform, questionId, questionName, code, ext }
    const res = await chrome.storage.local.get(['ghToken', 'repoName']);
    if (!res.ghToken || !res.repoName) {
        return { success: false, message: 'Missing GitHub token or repo in extension settings.' };
    }

    const { ghToken, repoName } = res;
    let path = '';
    
    if (data.platform === 'leetcode') {
        const formattedName = data.questionName.replace(/\s+/g, '_');
        path = `leetcode/${formattedName}/solution${data.ext}`;
    } else if (data.platform === 'codeforces') {
        const formattedName = data.questionName.replace(/\s+/g, '_');
        path = `codeforces/${formattedName}/solution${data.ext}`;
    }

    const apiUrl = `https://api.github.com/repos/${repoName}/contents/${path}`;
    
    try {
        // 1. Check if file already exists to get its SHA
        let sha = null;
        const getRes = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (getRes.status === 200) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        // 2. Upload the new code
        // Base64 encode the code handling unicode properly
        const encodedCode = btoa(unescape(encodeURIComponent(data.code)));
        
        const body = {
            message: `Add solution for ${data.questionName} (${data.platform})`,
            content: encodedCode
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (putRes.status === 201 || putRes.status === 200) {
            return { success: true, message: 'Successfully synced to GitHub!' };
        } else {
            const err = await putRes.json();
            return { success: false, message: `GitHub API Error: ${err.message}` };
        }
    } catch (e) {
        return { success: false, message: `Network error: ${e.message}` };
    }
}