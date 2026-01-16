(function() {
  'use strict';

  let isCleanMode = false;

  function toggleCleanMode() {
    isCleanMode = !isCleanMode;
    applyCleanMode();
    chrome.runtime.sendMessage({ action: 'updateIcon', enabled: isCleanMode });
  }

  function applyCleanMode() {
    if (isCleanMode) {
      document.body.classList.add('news-clean-mode');
    } else {
      document.body.classList.remove('news-clean-mode');
    }
  }

  function detectAndClean() {
    const url = window.location.href;
    
    if (url.includes('163.com') && (url.includes('/article/') || url.includes('/dy/article/'))) {
      chrome.storage.sync.get(['cleanModeEnabled'], function(result) {
        if (result.cleanModeEnabled) {
          isCleanMode = true;
          applyCleanMode();
        }
      });
    }
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleCleanMode') {
      toggleCleanMode();
      sendResponse({ enabled: isCleanMode });
    } else if (request.action === 'getStatus') {
      sendResponse({ enabled: isCleanMode });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndClean);
  } else {
    detectAndClean();
  }
})();
