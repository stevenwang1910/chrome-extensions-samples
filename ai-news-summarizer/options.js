// 选项页面脚本
document.addEventListener('DOMContentLoaded', function() {
  // 初始化
  initOptionsPage();
  
  // 绑定事件
  document.getElementById('show-add-form').addEventListener('click', showAddForm);
  document.getElementById('save-api').addEventListener('click', saveApiConfig);
  document.getElementById('cancel-add-api').addEventListener('click', hideAddForm);
});

// 初始化选项页面
function initOptionsPage() {
  loadApiConfigs();
}

// 加载API配置
function loadApiConfigs() {
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    renderApiList(apiConfigs);
  });
}

// 渲染API配置列表
function renderApiList(apiConfigs) {
  const apiListElement = document.getElementById('api-list');
  
  if (apiConfigs.length === 0) {
    apiListElement.innerHTML = '<div style="padding: 16px; text-align: center; color: #666;">暂无API配置，请添加新的API配置</div>';
    return;
  }
  
  apiListElement.innerHTML = '';
  
  apiConfigs.forEach(config => {
    const apiItem = createApiItem(config);
    apiListElement.appendChild(apiItem);
  });
}

// 创建API配置项
function createApiItem(config) {
  const apiItem = document.createElement('div');
  apiItem.className = 'api-item';
  apiItem.dataset.id = config.id;
  
  // API头部
  const apiHeader = document.createElement('div');
  apiHeader.className = 'api-header';
  
  const apiName = document.createElement('div');
  apiName.className = 'api-name';
  apiName.textContent = config.name;
  
  const apiStatus = document.createElement('span');
  apiStatus.className = `api-status ${config.enabled ? 'status-enabled' : 'status-disabled'}`;
  apiStatus.textContent = config.enabled ? '已启用' : '已禁用';
  
  const apiActions = document.createElement('div');
  apiActions.className = 'api-actions';
  
  const toggleButton = document.createElement('button');
  toggleButton.className = `button ${config.enabled ? 'button-primary' : 'button-success'}`;
  toggleButton.textContent = config.enabled ? '禁用' : '启用';
  toggleButton.addEventListener('click', () => toggleApiConfig(config.id, !config.enabled));
  
  const editButton = document.createElement('button');
  editButton.className = 'button button-primary';
  editButton.textContent = '编辑';
  editButton.addEventListener('click', () => editApiConfig(config.id));
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'button button-danger';
  deleteButton.textContent = '删除';
  deleteButton.addEventListener('click', () => deleteApiConfig(config.id));
  
  apiActions.appendChild(toggleButton);
  apiActions.appendChild(editButton);
  apiActions.appendChild(deleteButton);
  
  apiHeader.appendChild(apiName);
  apiHeader.appendChild(apiStatus);
  apiHeader.appendChild(apiActions);
  
  // API详情
  const apiDetails = document.createElement('div');
  apiDetails.className = 'api-details';
  
  const urlLabel = document.createElement('div');
  urlLabel.className = 'api-detail-label';
  urlLabel.textContent = 'API地址:';
  
  const urlValue = document.createElement('div');
  urlValue.className = 'api-detail-value';
  urlValue.textContent = config.url;
  
  const modelLabel = document.createElement('div');
  modelLabel.className = 'api-detail-label';
  modelLabel.textContent = '模型:';
  
  const modelValue = document.createElement('div');
  modelValue.className = 'api-detail-value';
  modelValue.textContent = config.model;
  
  const keyLabel = document.createElement('div');
  keyLabel.className = 'api-detail-label';
  keyLabel.textContent = '密钥:';
  
  const keyValue = document.createElement('div');
  keyValue.className = 'api-detail-value';
  keyValue.textContent = maskApiKey(config.apiKey);
  
  apiDetails.appendChild(urlLabel);
  apiDetails.appendChild(urlValue);
  apiDetails.appendChild(modelLabel);
  apiDetails.appendChild(modelValue);
  apiDetails.appendChild(keyLabel);
  apiDetails.appendChild(keyValue);
  
  apiItem.appendChild(apiHeader);
  apiItem.appendChild(apiDetails);
  
  return apiItem;
}

// 遮蔽API密钥
function maskApiKey(apiKey) {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return apiKey;
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
}

// 显示添加表单
function showAddForm() {
  const form = document.getElementById('add-api-form');
  form.classList.remove('hidden');
  
  // 重置表单
  document.getElementById('api-name').value = '';
  document.getElementById('api-url').value = 'https://api.openai.com/v1/chat/completions';
  document.getElementById('api-model').value = 'gpt-3.5-turbo';
  document.getElementById('api-key').value = '';
  document.getElementById('api-enabled').checked = true;
  
  // 隐藏通知
  hideNotification();
}

// 隐藏添加表单
function hideAddForm() {
  const form = document.getElementById('add-api-form');
  form.classList.add('hidden');
}

// 保存API配置
function saveApiConfig() {
  const name = document.getElementById('api-name').value.trim();
  const url = document.getElementById('api-url').value.trim();
  const model = document.getElementById('api-model').value.trim();
  const apiKey = document.getElementById('api-key').value.trim();
  const enabled = document.getElementById('api-enabled').checked;
  
  // 验证表单
  if (!name) {
    showNotification('请输入配置名称', 'error');
    return;
  }
  
  if (!url) {
    showNotification('请输入API地址', 'error');
    return;
  }
  
  if (!model) {
    showNotification('请输入模型名称', 'error');
    return;
  }
  
  if (!apiKey) {
    showNotification('请输入API密钥', 'error');
    return;
  }
  
  // 获取现有配置
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    
    // 如果启用新配置，先禁用所有其他配置
    if (enabled) {
      apiConfigs.forEach(config => {
        config.enabled = false;
      });
    }
    
    // 添加新配置
    const newConfig = {
      id: generateId(),
      name,
      url,
      model,
      apiKey,
      enabled
    };
    
    apiConfigs.push(newConfig);
    
    // 保存配置
    chrome.storage.sync.set({ apiConfigs }, () => {
      showNotification('API配置已保存', 'success');
      hideAddForm();
      loadApiConfigs();
    });
  });
}

// 切换API配置状态
function toggleApiConfig(id, enabled) {
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    
    // 如果启用此配置，先禁用所有其他配置
    if (enabled) {
      apiConfigs.forEach(config => {
        config.enabled = false;
      });
    }
    
    // 更新指定配置
    const configIndex = apiConfigs.findIndex(config => config.id === id);
    if (configIndex !== -1) {
      apiConfigs[configIndex].enabled = enabled;
      
      // 保存配置
      chrome.storage.sync.set({ apiConfigs }, () => {
        showNotification(`API配置已${enabled ? '启用' : '禁用'}`, 'success');
        loadApiConfigs();
      });
    }
  });
}

// 编辑API配置
function editApiConfig(id) {
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    const config = apiConfigs.find(config => config.id === id);
    
    if (config) {
      // 显示编辑表单
      const form = document.getElementById('add-api-form');
      form.classList.remove('hidden');
      
      // 填充表单
      document.getElementById('api-name').value = config.name;
      document.getElementById('api-url').value = config.url;
      document.getElementById('api-model').value = config.model;
      document.getElementById('api-key').value = config.apiKey;
      document.getElementById('api-enabled').checked = config.enabled;
      
      // 更改保存按钮的行为
      const saveButton = document.getElementById('save-api');
      saveButton.textContent = '更新配置';
      saveButton.onclick = () => updateApiConfig(id);
      
      // 隐藏通知
      hideNotification();
    }
  });
}

// 更新API配置
function updateApiConfig(id) {
  const name = document.getElementById('api-name').value.trim();
  const url = document.getElementById('api-url').value.trim();
  const model = document.getElementById('api-model').value.trim();
  const apiKey = document.getElementById('api-key').value.trim();
  const enabled = document.getElementById('api-enabled').checked;
  
  // 验证表单
  if (!name || !url || !model || !apiKey) {
    showNotification('请填写所有必填字段', 'error');
    return;
  }
  
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    
    // 如果启用此配置，先禁用所有其他配置
    if (enabled) {
      apiConfigs.forEach(config => {
        config.enabled = false;
      });
    }
    
    // 更新指定配置
    const configIndex = apiConfigs.findIndex(config => config.id === id);
    if (configIndex !== -1) {
      apiConfigs[configIndex] = {
        id,
        name,
        url,
        model,
        apiKey,
        enabled
      };
      
      // 保存配置
      chrome.storage.sync.set({ apiConfigs }, () => {
        showNotification('API配置已更新', 'success');
        hideAddForm();
        loadApiConfigs();
        
        // 恢复保存按钮的原始行为
        const saveButton = document.getElementById('save-api');
        saveButton.textContent = '保存配置';
        saveButton.onclick = saveApiConfig;
      });
    }
  });
}

// 删除API配置
function deleteApiConfig(id) {
  if (!confirm('确定要删除此API配置吗？')) {
    return;
  }
  
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    const updatedConfigs = apiConfigs.filter(config => config.id !== id);
    
    // 保存配置
    chrome.storage.sync.set({ apiConfigs: updatedConfigs }, () => {
      showNotification('API配置已删除', 'success');
      loadApiConfigs();
    });
  });
}

// 显示通知
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification notification-${type}`;
  notification.classList.remove('hidden');
  
  // 3秒后自动隐藏
  setTimeout(() => {
    hideNotification();
  }, 3000);
}

// 隐藏通知
function hideNotification() {
  const notification = document.getElementById('notification');
  notification.classList.add('hidden');
}

// 生成唯一ID
function generateId() {
  return 'api_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}