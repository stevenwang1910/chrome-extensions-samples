// 默认API配置模板
const defaultApiConfig = {
  id: '',
  name: '',
  url: '',
  model: 'gpt-3.5-turbo',
  key: '',
  isActive: false
};

// 预设的模型选项
const presetModels = [
  'gpt-3.5-turbo',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'qwen-turbo',
  'qwen-plus',
  'qwen-max',
  'deepseek-chat',
  'deepseek-coder',
  'custom'
];

let apiConfigs = [];
let expandedIndex = -1; // 当前展开的配置索引

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfigs();
  renderApiList();
  document.getElementById('addApiBtn').addEventListener('click', addNewApi);
});

// 加载配置
async function loadConfigs() {
  const result = await chrome.storage.sync.get(['apiConfigs']);
  apiConfigs = result.apiConfigs || [];
}

// 保存配置
async function saveConfigs() {
  await chrome.storage.sync.set({ apiConfigs });
  showStatus('配置已保存', 'success');
}

// 渲染API列表
function renderApiList() {
  const container = document.getElementById('apiList');
  container.innerHTML = '';

  if (apiConfigs.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无API配置，请点击下方按钮添加</div>';
    return;
  }

  apiConfigs.forEach((config, index) => {
    const apiItem = createApiItem(config, index);
    container.appendChild(apiItem);
  });
}

// 创建API配置项
function createApiItem(config, index) {
  const div = document.createElement('div');
  const isExpanded = index === expandedIndex;
  div.className = `api-item ${config.isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`;
  div.dataset.index = index;

  const modelOptions = presetModels.map(model => 
    `<option value="${model}" ${config.model === model ? 'selected' : ''}>${model}</option>`
  ).join('');

  div.innerHTML = `
    <div class="api-header">
      <div class="api-title">
        <span class="status-dot"></span>
        <span>${config.name || '未命名配置'}</span>
      </div>
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="api-content">
      <div class="form-row">
        <div class="form-group">
          <label>配置名称</label>
          <input type="text" class="api-name-input" value="${config.name}" placeholder="例如：OpenAI官方">
        </div>
        <div class="form-group">
          <label>模型</label>
          <select class="api-model-select">
            ${modelOptions}
          </select>
          <input type="text" class="custom-model-input" style="display: ${config.model === 'custom' ? 'block' : 'none'};" 
                 placeholder="输入自定义模型名称" value="${config.customModel || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>API URL</label>
        <input type="text" class="api-url-input" value="${config.url}" placeholder="https://api.openai.com/v1/chat/completions">
        <p class="help-text">OpenAI兼容格式的API端点地址</p>
      </div>
      <div class="form-group">
        <label>API Key</label>
        <input type="password" class="api-key-input" value="${config.key}" placeholder="sk-...">
      </div>
      <div class="api-actions">
        ${!config.isActive ? `<button class="btn btn-primary set-default-btn">设为默认</button>` : ''}
        <button class="btn btn-secondary save-btn">保存</button>
        <button class="btn btn-text danger delete-btn">删除</button>
      </div>
    </div>
  `;

  // 点击头部展开/收起
  const header = div.querySelector('.api-header');
  header.addEventListener('click', () => toggleExpand(index));

  // 模型选择变化时显示/隐藏自定义输入
  const modelSelect = div.querySelector('.api-model-select');
  const customInput = div.querySelector('.custom-model-input');
  modelSelect.addEventListener('change', (e) => {
    customInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  // 绑定按钮事件
  const setDefaultBtn = div.querySelector('.set-default-btn');
  if (setDefaultBtn) {
    setDefaultBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setAsDefault(index);
    });
  }

  const saveBtn = div.querySelector('.save-btn');
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateConfig(index, div);
  });

  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteApi(index);
  });

  return div;
}

// 展开/收起
function toggleExpand(index) {
  expandedIndex = expandedIndex === index ? -1 : index;
  renderApiList();
}

// 更新配置
function updateConfig(index, element) {
  const config = apiConfigs[index];
  
  config.name = element.querySelector('.api-name-input').value;
  config.url = element.querySelector('.api-url-input').value;
  config.key = element.querySelector('.api-key-input').value;
  
  const modelSelect = element.querySelector('.api-model-select');
  config.model = modelSelect.value;
  
  if (config.model === 'custom') {
    config.customModel = element.querySelector('.custom-model-input').value;
  }

  saveConfigs();
}

// 添加新API
function addNewApi() {
  const newConfig = {
    ...defaultApiConfig,
    id: Date.now().toString(),
    name: `API配置 ${apiConfigs.length + 1}`
  };
  
  // 如果是第一个配置，设为默认
  if (apiConfigs.length === 0) {
    newConfig.isActive = true;
  }
  
  apiConfigs.push(newConfig);
  expandedIndex = apiConfigs.length - 1; // 自动展开新添加的
  saveConfigs();
  renderApiList();
}

// 设为默认
function setAsDefault(index) {
  apiConfigs.forEach((config, i) => {
    config.isActive = i === index;
  });
  saveConfigs();
  renderApiList();
}

// 删除API
function deleteApi(index) {
  if (confirm('确定要删除这个API配置吗？')) {
    const wasActive = apiConfigs[index].isActive;
    apiConfigs.splice(index, 1);
    
    // 如果删除的是默认配置，且还有其他配置，将第一个设为默认
    if (wasActive && apiConfigs.length > 0) {
      apiConfigs[0].isActive = true;
    }
    
    // 调整展开索引
    if (expandedIndex === index) {
      expandedIndex = -1;
    } else if (expandedIndex > index) {
      expandedIndex--;
    }
    
    saveConfigs();
    renderApiList();
  }
}

// 显示状态提示
function showStatus(message, type) {
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = message;
  statusEl.className = `save-status ${type} show`;
  
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 2000);
}
