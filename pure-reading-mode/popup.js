let isPureReadingActive = false;

function updateStatus() {
  const statusEl = document.getElementById('status');
  if (isPureReadingActive) {
    statusEl.textContent = '纯净阅读已启用';
    statusEl.className = 'status active';
  } else {
    statusEl.textContent = '当前未启用';
    statusEl.className = 'status inactive';
  }
}

function sendMessageToTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}

document.getElementById('enableBtn').addEventListener('click', () => {
  isPureReadingActive = true;
  updateStatus();
  sendMessageToTab({ action: 'enablePureReading' });
});

document.getElementById('disableBtn').addEventListener('click', () => {
  isPureReadingActive = false;
  updateStatus();
  sendMessageToTab({ action: 'disablePureReading' });
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].id) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'checkStatus' }, (response) => {
      if (response && response.isActive) {
        isPureReadingActive = true;
        updateStatus();
      }
    });
  }
});