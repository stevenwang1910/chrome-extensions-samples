document.addEventListener('DOMContentLoaded', function() {
  const autoModeCheckbox = document.getElementById('autoModeCheckbox');
  const autoModeToggle = document.getElementById('autoModeToggle');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusMessage = document.getElementById('statusMessage');

  function loadSettings() {
    chrome.storage.sync.get(['autoPureMode'], function(result) {
      autoModeCheckbox.checked = result.autoPureMode || false;
      updateToggleState();
    });
  }

  function saveSettings() {
    const settings = {
      autoPureMode: autoModeCheckbox.checked
    };

    chrome.storage.sync.set(settings, function() {
      showMessage('设置已保存', 'success');
    });
  }

  function resetSettings() {
    chrome.storage.sync.set({
      autoPureMode: false
    }, function() {
      loadSettings();
      showMessage('已恢复默认设置', 'success');
    });
  }

  function updateToggleState() {
    if (autoModeCheckbox.checked) {
      autoModeToggle.classList.add('active');
    } else {
      autoModeToggle.classList.remove('active');
    }
  }

  function showMessage(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = 'status-message show';
    
    if (type === 'success') {
      statusMessage.classList.add('success');
    } else if (type === 'error') {
      statusMessage.classList.add('error');
    }

    setTimeout(function() {
      statusMessage.className = 'status-message';
    }, 2000);
  }

  autoModeCheckbox.addEventListener('change', function() {
    updateToggleState();
  });

  autoModeToggle.addEventListener('click', function(e) {
    if (!autoModeCheckbox.disabled) {
      autoModeCheckbox.checked = !autoModeCheckbox.checked;
      updateToggleState();
    }
  });

  saveBtn.addEventListener('click', function() {
    saveSettings();
  });

  resetBtn.addEventListener('click', function() {
    if (confirm('确定要恢复默认设置吗？')) {
      resetSettings();
    }
  });

  loadSettings();
});
