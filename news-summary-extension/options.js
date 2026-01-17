let apiConfigs = [];
let defaultApiId = null;

async function loadApiConfigs() {
  const result = await chrome.storage.local.get(['apiConfigs', 'defaultApiId']);
  apiConfigs = result.apiConfigs || [];
  defaultApiId = result.defaultApiId || null;
}

async function saveApiConfigs() {
  await chrome.storage.local.set({ apiConfigs, defaultApiId });
}

function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = message;
  messageEl.className = `message ${type} show`;
  
  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}

function renderApiList() {
  const apiListEl = document.getElementById('apiList');
  
  if (apiConfigs.length === 0) {
    apiListEl.innerHTML = `
      <div class="empty-state">
        <p>暂无API配置</p>
        <button class="btn btn-primary" onclick="showAddForm()">添加第一个API</button>
      </div>
    `;
    return;
  }
  
  apiListEl.innerHTML = apiConfigs.map(config => `
    <div class="api-item ${config.id === defaultApiId ? 'selected' : ''}" data-id="${config.id}">
      <div class="api-item-header">
        <span class="api-item-name">${escapeHtml(config.name)}</span>
        <span class="api-item-type">${getApiTypeLabel(config.type)}</span>
      </div>
      <div class="api-item-info">
        模型: ${escapeHtml(config.model)}
      </div>
      <div class="api-item-info">
        地址: ${escapeHtml(config.url.substring(0, 50))}${config.url.length > 50 ? '...' : ''}
      </div>
      ${config.id === defaultApiId ? '<div class="api-item-info" style="color: #667eea; font-weight: 500; margin-top: 4px;">✓ 默认API</div>' : ''}
      <div class="api-item-actions">
        <button class="btn btn-secondary" onclick="editApi('${config.id}')">编辑</button>
        <button class="btn btn-secondary" onclick="setDefaultApi('${config.id}')">${config.id === defaultApiId ? '取消默认' : '设为默认'}</button>
        <button class="btn btn-danger" onclick="deleteApi('${config.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getApiTypeLabel(type) {
  const labels = {
    'openai': 'OpenAI',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'other': 'Other'
  };
  return labels[type] || type;
}

function showAddForm() {
  document.getElementById('addApiCard').classList.remove('hidden');
  document.getElementById('apiForm').reset();
  document.getElementById('editApiId').value = '';
  document.querySelector('.add-api-card h2').textContent = '添加新API';
}

function cancelEdit() {
  document.getElementById('addApiCard').classList.add('hidden');
  document.getElementById('apiForm').reset();
  document.getElementById('editApiId').value = '';
}

function editApi(id) {
  const config = apiConfigs.find(c => c.id === id);
  if (!config) return;
  
  document.getElementById('editApiId').value = id;
  document.getElementById('apiName').value = config.name;
  document.getElementById('apiType').value = config.type;
  document.getElementById('apiUrl').value = config.url;
  document.getElementById('apiKey').value = config.key;
  document.getElementById('apiModel').value = config.model;
  
  document.querySelector('.add-api-card h2').textContent = '编辑API配置';
  document.getElementById('addApiCard').classList.remove('hidden');
}

async function setDefaultApi(id) {
  if (defaultApiId === id) {
    defaultApiId = null;
    showMessage('已取消默认API设置', 'info');
  } else {
    defaultApiId = id;
    const config = apiConfigs.find(c => c.id === id);
    showMessage(`已将 ${config.name} 设置为默认API`, 'success');
  }
  
  await saveApiConfigs();
  renderApiList();
}

async function deleteApi(id) {
  if (!confirm('确定要删除这个API配置吗？')) {
    return;
  }
  
  apiConfigs = apiConfigs.filter(c => c.id !== id);
  
  if (defaultApiId === id) {
    defaultApiId = apiConfigs.length > 0 ? apiConfigs[0].id : null;
  }
  
  await saveApiConfigs();
  renderApiList();
  showMessage('API配置已删除', 'success');
}

function validateForm(formData) {
  if (!formData.name || formData.name.trim() === '') {
    return '请输入配置名称';
  }
  
  if (!formData.type) {
    return '请选择API类型';
  }
  
  if (!formData.url || formData.url.trim() === '') {
    return '请输入API地址';
  }
  
  try {
    new URL(formData.url);
  } catch (e) {
    return '请输入有效的API地址';
  }
  
  if (!formData.key || formData.key.trim() === '') {
    return '请输入API Key';
  }
  
  if (!formData.model || formData.model.trim() === '') {
    return '请输入模型名称';
  }
  
  return null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById('editApiId').value;
  const formData = {
    name: document.getElementById('apiName').value.trim(),
    type: document.getElementById('apiType').value,
    url: document.getElementById('apiUrl').value.trim(),
    key: document.getElementById('apiKey').value.trim(),
    model: document.getElementById('apiModel').value.trim()
  };
  
  const validationError = validateForm(formData);
  if (validationError) {
    showMessage(validationError, 'error');
    return;
  }
  
  if (editId) {
    const index = apiConfigs.findIndex(c => c.id === editId);
    if (index !== -1) {
      apiConfigs[index] = { ...apiConfigs[index], ...formData };
      showMessage('API配置已更新', 'success');
    }
  } else {
    const newConfig = {
      id: Date.now().toString(),
      ...formData
    };
    apiConfigs.push(newConfig);
    
    if (apiConfigs.length === 1) {
      defaultApiId = newConfig.id;
    }
    
    showMessage('API配置已添加', 'success');
  }
  
  await saveApiConfigs();
  renderApiList();
  cancelEdit();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadApiConfigs();
  renderApiList();
  
  document.getElementById('apiForm').addEventListener('submit', handleFormSubmit);
});
