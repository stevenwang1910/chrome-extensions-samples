// AI新闻总结小助手 - Popup脚本
// 处理popup界面的交互逻辑

(function() {
  'use strict';

  let currentNewsContent = null;
  let currentApiConfigs = [];
  let editingApiId = null;

  // DOM元素
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const extractBtn = document.getElementById('extract-btn');
  const summarizeBtn = document.getElementById('summarize-btn');
  const newsTitleEl = document.getElementById('news-title');
  const summaryResultEl = document.getElementById('summary-result');
  const statusMessageEl = document.getElementById('status-message');
  const configStatusEl = document.getElementById('config-status');
  const addApiBtn = document.getElementById('add-api-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const apiListEl = document.getElementById('api-list');
  const apiSelector = document.getElementById('api-selector');

  // API配置输入框
  const apiNameInput = document.getElementById('api-name');
  const apiUrlInput = document.getElementById('api-url');
  const apiModelInput = document.getElementById('api-model');
  const apiKeyInput = document.getElementById('api-key');

  // 初始化
  function init() {
    loadApiConfigs();
    setupEventListeners();
    checkCurrentTab();
    autoExtractAndSummarize();
  }

  // 自动提取内容和生成摘要
  async function autoExtractAndSummarize() {
    await extractNewsContent();
    
    if (currentNewsContent && currentApiConfigs.length > 0) {
      await generateSummary();
    }
  }

  // 设置事件监听器
  function setupEventListeners() {
    // 标签页切换
    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 提取新闻内容
    extractBtn.addEventListener('click', extractNewsContent);

    // 生成摘要
    summarizeBtn.addEventListener('click', generateSummary);

    // 添加API配置
    addApiBtn.addEventListener('click', addApiConfig);

    // 取消编辑
    cancelEditBtn.addEventListener('click', cancelEdit);

    // 清空所有配置
    clearAllBtn.addEventListener('click', clearAllConfigs);

    // API选择器变化
    apiSelector.addEventListener('change', onApiSelectorChange);
  }

  // 切换标签页
  function switchTab(tabName) {
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    if (tabName === 'config') {
      renderApiList();
    } else if (tabName === 'summary') {
      updateApiSelector();
    }
  }

  // 检查当前标签页是否是新闻页面
  function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab.url.match(/^(https?:\/\/)?(www\.)?(163\.com|sina\.com\.cn|qq\.com|sohu\.com)/)) {
        showStatus('请访问新闻网站页面使用此扩展', 'info');
        extractBtn.disabled = true;
      }
    });
  }

  // 提取新闻内容
  function extractNewsContent() {
    showStatus('正在提取新闻内容...', 'info');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      
      // 检查URL是否匹配
      if (!currentTab.url.match(/^(https?:\/\/)?(www\.)?(163\.com|sina\.com\.cn|qq\.com|sohu\.com)/)) {
        showStatus('当前页面不是新闻网站，无法提取内容', 'error');
        return;
      }

      // 发送消息给content script
      chrome.tabs.sendMessage(currentTab.id, { action: 'extractNewsContent' }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('无法提取内容，请刷新页面后重试', 'error');
          return;
        }

        if (response && (response.title || response.content)) {
          currentNewsContent = response;
          newsTitleEl.textContent = response.title || '无标题';
          summaryResultEl.textContent = '点击"生成AI摘要"按钮获取摘要';
          summarizeBtn.disabled = false;
          showStatus('新闻内容提取成功！', 'success');
        } else {
          showStatus('未能提取到新闻内容', 'error');
        }
      });
    });
  }

  // 生成摘要
  async function generateSummary() {
    if (!currentNewsContent) {
      showStatus('请先提取新闻内容', 'error');
      return;
    }

    // 检查是否有API配置
    if (currentApiConfigs.length === 0) {
      showStatus('请先配置API', 'error');
      switchTab('config');
      return;
    }

    // 获取选中的API，如果没有选中则自动选择第一个
    let selectedApiId = apiSelector.value;
    if (!selectedApiId) {
      selectedApiId = currentApiConfigs[0].id;
      apiSelector.value = selectedApiId;
    }

    const apiConfig = currentApiConfigs.find(config => config.id === selectedApiId);
    if (!apiConfig) {
      showStatus('选中的API不存在，请重新选择', 'error');
      updateApiSelector();
      return;
    }

    showStatus(`正在使用 ${apiConfig.name} 生成摘要...`, 'info');
    summaryResultEl.innerHTML = '<div class="spinner"></div>';
    summarizeBtn.disabled = true;

    try {
      const summary = await callApi(apiConfig, currentNewsContent);
      
      summaryResultEl.textContent = summary;
      showStatus(`摘要生成成功！使用API: ${apiConfig.name}`, 'success');
    } catch (error) {
      summaryResultEl.textContent = '生成失败：' + error.message;
      showStatus(`生成摘要失败：${error.message}`, 'error');
    } finally {
      summarizeBtn.disabled = false;
    }
  }

  // 调用API
  async function callApi(apiConfig, newsContent) {
    const prompt = `请将以下新闻内容总结为简洁的摘要：\n\n标题：${newsContent.title}\n\n内容：${newsContent.content}`;

    const response = await fetch(apiConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.key}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // 处理不同API的响应格式
    let summary = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      summary = data.choices[0].message.content.trim();
    } else if (data.message) {
      summary = data.message.content.trim();
    } else {
      throw new Error('API返回格式不正确');
    }

    return summary;
  }

  // 添加或更新API配置
  function addApiConfig() {
    const name = apiNameInput.value.trim();
    const url = apiUrlInput.value.trim();
    const model = apiModelInput.value.trim();
    const key = apiKeyInput.value.trim();

    if (!name || !url || !model || !key) {
      showConfigStatus('请填写所有字段', 'error');
      return;
    }

    if (editingApiId) {
      // 更新现有配置
      const index = currentApiConfigs.findIndex(config => config.id === editingApiId);
      if (index !== -1) {
        currentApiConfigs[index] = {
          ...currentApiConfigs[index],
          name,
          url,
          model,
          key,
          updatedAt: new Date().toISOString()
        };
        showConfigStatus('API配置更新成功！', 'success');
      }
    } else {
      // 添加新配置
      const config = {
        id: Date.now().toString(),
        name,
        url,
        model,
        key,
        createdAt: new Date().toISOString()
      };
      currentApiConfigs.push(config);
      showConfigStatus('API配置添加成功！', 'success');
    }

    saveApiConfigs();
    renderApiList();
    updateApiSelector();
    clearInputs();
    resetEditMode();
  }

  // 编辑API配置
  function editApiConfig(id) {
    const config = currentApiConfigs.find(config => config.id === id);
    if (!config) {
      showConfigStatus('未找到要编辑的配置', 'error');
      return;
    }

    editingApiId = id;
    apiNameInput.value = config.name;
    apiUrlInput.value = config.url;
    apiModelInput.value = config.model;
    apiKeyInput.value = config.key;

    addApiBtn.textContent = '更新配置';
    cancelEditBtn.style.display = 'block';
    showConfigStatus('正在编辑配置，点击"更新配置"保存修改', 'info');
  }

  // 取消编辑模式
  function resetEditMode() {
    editingApiId = null;
    addApiBtn.textContent = '添加API配置';
    cancelEditBtn.style.display = 'none';
  }

  // 取消编辑
  function cancelEdit() {
    resetEditMode();
    clearInputs();
    showConfigStatus('已取消编辑', 'info');
  }

  // 删除API配置
  function deleteApiConfig(id) {
    currentApiConfigs = currentApiConfigs.filter(config => config.id !== id);
    saveApiConfigs();
    renderApiList();
    updateApiSelector();
    showConfigStatus('API配置已删除', 'success');
  }

  // 清空所有配置
  function clearAllConfigs() {
    if (confirm('确定要清空所有API配置吗？')) {
      currentApiConfigs = [];
      saveApiConfigs();
      renderApiList();
      updateApiSelector();
      showConfigStatus('所有配置已清空', 'success');
    }
  }

  // 渲染API列表
  function renderApiList() {
    if (currentApiConfigs.length === 0) {
      apiListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">暂无API配置，请添加</div>
        </div>
      `;
      return;
    }

    apiListEl.innerHTML = currentApiConfigs.map(config => `
      <div class="api-item">
        <div class="api-item-header">
          <div class="api-item-name">${escapeHtml(config.name)}</div>
          <div class="api-item-actions">
            <button class="btn-small btn-edit" onclick="editApiConfig('${config.id}')">编辑</button>
            <button class="btn-small btn-delete" onclick="deleteApiConfig('${config.id}')">删除</button>
          </div>
        </div>
        <div class="api-item-details">
          <div>URL: ${escapeHtml(config.url)}</div>
          <div>模型: ${escapeHtml(config.model)}</div>
          <div>密钥: ${escapeHtml(config.key.substring(0, 10))}***</div>
        </div>
      </div>
    `).join('');
  }

  // 更新API选择器
  function updateApiSelector() {
    const currentValue = apiSelector.value;
    
    if (currentApiConfigs.length === 0) {
      apiSelector.innerHTML = '<option value="">请先配置API</option>';
      apiSelector.disabled = true;
      return;
    }

    apiSelector.disabled = false;
    apiSelector.innerHTML = currentApiConfigs.map(config => 
      `<option value="${config.id}">${escapeHtml(config.name)} (${escapeHtml(config.model)})</option>`
    ).join('');

    // 如果之前选中的API还存在，保持选中状态
    if (currentValue && currentApiConfigs.find(config => config.id === currentValue)) {
      apiSelector.value = currentValue;
    }
  }

  // API选择器变化处理
  function onApiSelectorChange() {
    const selectedApiId = apiSelector.value;
    if (selectedApiId) {
      const apiConfig = currentApiConfigs.find(config => config.id === selectedApiId);
      if (apiConfig) {
        showStatus(`已选择API: ${apiConfig.name}`, 'info');
      }
    }
  }

  // 加载API配置
  function loadApiConfigs() {
    chrome.storage.local.get(['apiConfigs'], (result) => {
      currentApiConfigs = result.apiConfigs || [];
      renderApiList();
      updateApiSelector();
    });
  }

  // 保存API配置
  function saveApiConfigs() {
    chrome.storage.local.set({ apiConfigs: currentApiConfigs });
  }

  // 清空输入框
  function clearInputs() {
    apiNameInput.value = '';
    apiUrlInput.value = '';
    apiModelInput.value = '';
    apiKeyInput.value = '';
  }

  // 显示状态消息
  function showStatus(message, type) {
    statusMessageEl.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // 3秒后自动清除
    setTimeout(() => {
      statusMessageEl.innerHTML = '';
    }, 3000);
  }

  // 显示配置状态消息
  function showConfigStatus(message, type) {
    configStatusEl.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // 3秒后自动清除
    setTimeout(() => {
      configStatusEl.innerHTML = '';
    }, 3000);
  }

  // HTML转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 暴露删除和编辑函数到全局作用域
  window.deleteApiConfig = deleteApiConfig;
  window.editApiConfig = editApiConfig;
  window.cancelEdit = cancelEdit;

  // 初始化
  init();
})();