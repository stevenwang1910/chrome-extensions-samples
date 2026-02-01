// 弹窗脚本
document.addEventListener('DOMContentLoaded', function() {
  // 初始化
  initPopup();
  
  // 绑定事件
  document.getElementById('summarize-btn').addEventListener('click', handleSummarizeClick);
  document.getElementById('options-btn').addEventListener('click', handleOptionsClick);
  document.getElementById('add-api').addEventListener('click', handleAddApiClick);
  document.getElementById('manage-apis').addEventListener('click', handleManageApisClick);
});

// 初始化弹窗
function initPopup() {
  // 显示当前页面信息
  displayCurrentPage();
  
  // 加载API配置
  loadApiConfigs();
}

// 显示当前页面信息
function displayCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const pageUrlElement = document.getElementById('page-url');
    
    if (currentTab) {
      pageUrlElement.textContent = currentTab.url;
      
      // 检查是否是支持的新闻网站
      const isNewsSite = isSupportedNewsSite(currentTab.url);
      const summarizeBtn = document.getElementById('summarize-btn');
      
      if (!isNewsSite) {
        summarizeBtn.disabled = true;
        summarizeBtn.textContent = '仅支持新闻网站';
        showError('当前页面不是支持的新闻网站');
      }
    }
  });
}

// 检查是否是支持的新闻网站
function isSupportedNewsSite(url) {
  const supportedSites = [
    '163.com',
    'news.163.com',
    'www.163.com'
  ];
  
  return supportedSites.some(site => url.includes(site));
}

// 加载API配置
function loadApiConfigs() {
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    const apiConfigs = result.apiConfigs || [];
    const apiListElement = document.getElementById('api-list');
    
    if (apiConfigs.length === 0) {
      apiListElement.innerHTML = '<div style="padding: 8px; color: #666;">暂无API配置，请添加API配置</div>';
      return;
    }
    
    apiListElement.innerHTML = '';
    
    apiConfigs.forEach(config => {
      const apiItem = document.createElement('div');
      apiItem.className = 'api-item';
      
      const apiName = document.createElement('div');
      apiName.className = 'api-name';
      apiName.textContent = config.name;
      
      const apiDetails = document.createElement('div');
      apiDetails.className = 'api-details';
      apiDetails.textContent = `${config.model} - ${config.url.substring(0, 30)}...`;
      
      const apiStatus = document.createElement('span');
      apiStatus.className = `api-status ${config.enabled ? 'status-enabled' : 'status-disabled'}`;
      apiStatus.textContent = config.enabled ? '已启用' : '已禁用';
      
      apiItem.appendChild(apiName);
      apiItem.appendChild(apiDetails);
      apiItem.appendChild(apiStatus);
      
      apiListElement.appendChild(apiItem);
    });
  });
}

// 处理总结按钮点击
function handleSummarizeClick() {
  const summarizeBtn = document.getElementById('summarize-btn');
  const originalText = summarizeBtn.textContent;
  
  // 显示加载状态
  summarizeBtn.disabled = true;
  summarizeBtn.textContent = '正在总结...';
  hideError();
  
  // 获取当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    // 检查是否有启用的API配置
    chrome.storage.sync.get(['apiConfigs'], (result) => {
      const apiConfigs = result.apiConfigs || [];
      const enabledConfig = apiConfigs.find(config => config.enabled);
      
      if (!enabledConfig) {
        showError('请先配置并启用至少一个API');
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = originalText;
        return;
      }
      
      // 直接发送消息到内容脚本（内容脚本已在manifest中注册）
      chrome.tabs.sendMessage(currentTab.id, { action: 'summarizeNews' }, (response) => {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = originalText;
        
        if (chrome.runtime.lastError) {
          showError('无法与页面通信，请刷新页面后重试');
          return;
        }
        
        if (response && response.success) {
          showSummaryResult(response.summary);
        } else {
          showError(response ? response.error : '总结失败');
        }
      });
    });
  });
}

// 处理选项按钮点击
function handleOptionsClick() {
  chrome.runtime.openOptionsPage();
}

// 处理添加API按钮点击
function handleAddApiClick() {
  chrome.runtime.openOptionsPage();
}

// 处理管理API按钮点击
function handleManageApisClick() {
  chrome.runtime.openOptionsPage();
}

// 显示总结结果
function showSummaryResult(summary) {
  const summaryResultElement = document.getElementById('summary-result');
  const summaryContentElement = document.getElementById('summary-content');
  
  summaryContentElement.textContent = summary;
  summaryResultElement.style.display = 'block';
}

// 显示错误信息
function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
}

// 隐藏错误信息
function hideError() {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = '';
}