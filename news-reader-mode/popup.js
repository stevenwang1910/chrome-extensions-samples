(function() {
  'use strict';

  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');
  const autoToggleBtn = document.getElementById('autoToggleBtn');

  function updateUI(enabled) {
    if (enabled) {
      statusEl.textContent = '纯净模式：开启';
      statusEl.className = 'status active';
      toggleBtn.textContent = '关闭纯净阅读模式';
    } else {
      statusEl.textContent = '纯净模式：关闭';
      statusEl.className = 'status inactive';
      toggleBtn.textContent = '开启纯净阅读模式';
    }
  }

  function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      callback(tabs[0]);
    });
  }

  function checkStatus() {
    getCurrentTab(function(tab) {
      if (tab.url && tab.url.includes('163.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, function(response) {
          if (response) {
            updateUI(response.enabled);
          }
        });
      } else {
        statusEl.textContent = '非网易新闻页面';
        statusEl.className = 'status inactive';
        toggleBtn.disabled = true;
      }
    });
  }

  function toggleMode() {
    getCurrentTab(function(tab) {
      if (tab.url && tab.url.includes('163.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleCleanMode' }, function(response) {
          if (response) {
            updateUI(response.enabled);
          }
        });
      }
    });
  }

  function toggleAutoMode() {
    chrome.storage.sync.get(['cleanModeEnabled'], function(result) {
      const newValue = !result.cleanModeEnabled;
      chrome.storage.sync.set({ cleanModeEnabled: newValue }, function() {
        autoToggleBtn.textContent = newValue ? '关闭自动纯净模式' : '自动开启纯净模式';
        autoToggleBtn.style.backgroundColor = newValue ? '#e8f5e9' : '#f5f5f5';
      });
    });
  }

  function init() {
    chrome.storage.sync.get(['cleanModeEnabled'], function(result) {
      if (result.cleanModeEnabled) {
        autoToggleBtn.textContent = '关闭自动纯净模式';
        autoToggleBtn.style.backgroundColor = '#e8f5e9';
      }
    });

    checkStatus();
  }

  toggleBtn.addEventListener('click', toggleMode);
  autoToggleBtn.addEventListener('click', toggleAutoMode);

  init();
})();
