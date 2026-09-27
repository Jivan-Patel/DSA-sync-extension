document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('ghToken');
    const repoInput = document.getElementById('repoName');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Load saved data
    chrome.storage.local.get(['ghToken', 'repoName'], (res) => {
        if (res.ghToken) tokenInput.value = res.ghToken;
        if (res.repoName) repoInput.value = res.repoName;
    });

    saveBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        const repo = repoInput.value.trim();
        
        chrome.storage.local.set({ ghToken: token, repoName: repo }, () => {
            statusDiv.textContent = 'Configuration saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 2000);
        });
    });
});