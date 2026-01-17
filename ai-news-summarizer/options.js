function saveSettings() {
    const settings = {
        providers: {
            1: {
                name: document.getElementById('provider1-name').value,
                apiUrl: document.getElementById('provider1-api-url').value,
                apiKey: document.getElementById('provider1-api-key').value,
                model: document.getElementById('provider1-model').value,
                maxTokens: parseInt(document.getElementById('provider1-max-tokens').value) || 100
            },
            2: {
                name: document.getElementById('provider2-name').value,
                apiUrl: document.getElementById('provider2-api-url').value,
                apiKey: document.getElementById('provider2-api-key').value,
                model: document.getElementById('provider2-model').value,
                maxTokens: parseInt(document.getElementById('provider2-max-tokens').value) || 100
            }
        },
        defaultProvider: document.getElementById('default-provider').value
    };

    chrome.storage.local.set({settings}, () => {
        showStatus('Settings saved successfully!', 'success');
    });
}

function loadSettings() {
    chrome.storage.local.get('settings', (result) => {
        const settings = result.settings || {
            providers: {},
            defaultProvider: '1'
        };

        const provider1 = settings.providers[1] || {};
        document.getElementById('provider1-name').value = provider1.name || '';
        document.getElementById('provider1-api-url').value = provider1.apiUrl || '';
        document.getElementById('provider1-api-key').value = provider1.apiKey || '';
        document.getElementById('provider1-model').value = provider1.model || '';
        document.getElementById('provider1-max-tokens').value = provider1.maxTokens || 100;

        const provider2 = settings.providers[2] || {};
        document.getElementById('provider2-name').value = provider2.name || '';
        document.getElementById('provider2-api-url').value = provider2.apiUrl || '';
        document.getElementById('provider2-api-key').value = provider2.apiKey || '';
        document.getElementById('provider2-model').value = provider2.model || '';
        document.getElementById('provider2-max-tokens').value = provider2.maxTokens || 100;

        document.getElementById('default-provider').value = settings.defaultProvider || '1';
    });
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings?')) {
        document.getElementById('provider1-name').value = '';
        document.getElementById('provider1-api-url').value = '';
        document.getElementById('provider1-api-key').value = '';
        document.getElementById('provider1-model').value = '';
        document.getElementById('provider1-max-tokens').value = '100';
        
        document.getElementById('provider2-name').value = '';
        document.getElementById('provider2-api-url').value = '';
        document.getElementById('provider2-api-key').value = '';
        document.getElementById('provider2-model').value = '';
        document.getElementById('provider2-max-tokens').value = '100';
        
        document.getElementById('default-provider').value = '1';
        
        saveSettings();
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
    }, 3000);
}

document.getElementById('save-btn').addEventListener('click', saveSettings);
document.getElementById('reset-btn').addEventListener('click', resetSettings);

loadSettings();
