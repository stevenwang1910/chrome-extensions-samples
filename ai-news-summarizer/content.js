// 内容脚本，注入到新闻页面中
(function() {
  'use strict';
  
  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsSummarizer);
  } else {
    initNewsSummarizer();
  }
  
  function initNewsSummarizer() {
    // 检查是否是新闻文章页面
    if (!isNewsArticlePage()) {
      return;
    }
    
    // 创建总结按钮
    createSummaryButton();
  }
  
  // 判断是否是新闻文章页面
  function isNewsArticlePage() {
    // 检查URL是否包含新闻文章的特征
    const url = window.location.href;
    const isArticlePage = url.includes('/dy/article/') || 
                         url.includes('/news/article/') ||
                         document.querySelector('.post_text') ||
                         document.querySelector('.article-content') ||
                         document.querySelector('.news-content');
    
    return isArticlePage;
  }
  
  // 创建总结按钮
  function createSummaryButton() {
    // 查找合适的位置插入按钮
    const targetElement = findTargetElement();
    if (!targetElement) return;
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin: 10px 0;
      text-align: center;
    `;
    
    // 创建总结按钮
    const summaryButton = document.createElement('button');
    summaryButton.textContent = 'AI总结新闻';
    summaryButton.style.cssText = `
      background-color: #1890ff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      transition: background-color 0.3s;
    `;
    
    // 创建配置按钮
    const configButton = document.createElement('button');
    configButton.textContent = 'API配置';
    configButton.style.cssText = `
      background-color: #52c41a;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    `;
    
    // 添加悬停效果
    summaryButton.addEventListener('mouseover', () => {
      summaryButton.style.backgroundColor = '#40a9ff';
    });
    
    summaryButton.addEventListener('mouseout', () => {
      summaryButton.style.backgroundColor = '#1890ff';
    });
    
    configButton.addEventListener('mouseover', () => {
      configButton.style.backgroundColor = '#73d13d';
    });
    
    configButton.addEventListener('mouseout', () => {
      configButton.style.backgroundColor = '#52c41a';
    });
    
    // 添加点击事件
    summaryButton.addEventListener('click', handleSummaryClick);
    configButton.addEventListener('click', handleConfigClick);
    
    // 将按钮添加到容器
    buttonContainer.appendChild(summaryButton);
    buttonContainer.appendChild(configButton);
    
    // 将容器插入到目标位置
    targetElement.parentNode.insertBefore(buttonContainer, targetElement.nextSibling);
  }
  
  // 查找插入按钮的目标位置
  function findTargetElement() {
    // 尝试多种可能的文章标题或内容元素
    const selectors = [
      '.post_title',
      '.article-title',
      '.news-title',
      'h1',
      '.post_text',
      '.article-content',
      '.news-content'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  }
  
  // 处理总结按钮点击
  function handleSummaryClick() {
    const newsContent = extractNewsContent();
    if (!newsContent || newsContent.trim().length < 50) {
      showNotification('未能提取到有效的新闻内容', 'error');
      return;
    }
    
    // 显示加载状态
    showLoadingState();
    
    // 发送消息到后台脚本
    chrome.runtime.sendMessage({
      action: 'summarizeNews',
      content: newsContent
    }, (response) => {
      hideLoadingState();
      
      if (response.success) {
        showSummaryResult(response.summary);
      } else {
        showNotification(response.error, 'error');
      }
    });
  }
  
  // 处理配置按钮点击
  function handleConfigClick() {
    // 打开配置页面
    chrome.runtime.openOptionsPage();
  }
  
  // 提取新闻内容
  function extractNewsContent() {
    // 尝试多种选择器来提取新闻内容
    const contentSelectors = [
      '.post_text',
      '.article-content',
      '.news-content',
      '.post_body',
      '.article-body',
      'article'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // 清理HTML标签，只保留文本内容
        return element.innerText || element.textContent;
      }
    }
    
    // 如果没有找到特定的内容区域，尝试获取整个页面的主要内容
    const bodyText = document.body.innerText || document.body.textContent;
    // 过滤掉导航、广告等无关内容
    const lines = bodyText.split('\n').filter(line => line.trim().length > 20);
    return lines.join('\n');
  }
  
  // 显示加载状态
  function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'ai-summary-loading';
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
    `;
    loadingDiv.textContent = '正在生成AI总结，请稍候...';
    document.body.appendChild(loadingDiv);
  }
  
  // 隐藏加载状态
  function hideLoadingState() {
    const loadingDiv = document.getElementById('ai-summary-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }
  
  // 显示总结结果
  function showSummaryResult(summary) {
    // 创建结果弹窗
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 500px;
      width: 90%;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'AI新闻总结';
    title.style.cssText = `
      margin-top: 0;
      color: #1890ff;
    `;
    
    const content = document.createElement('p');
    content.textContent = summary;
    content.style.cssText = `
      line-height: 1.5;
      margin-bottom: 20px;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.cssText = `
      background-color: #1890ff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    closeButton.addEventListener('click', () => {
      resultDiv.remove();
    });
    
    resultDiv.appendChild(title);
    resultDiv.appendChild(content);
    resultDiv.appendChild(closeButton);
    
    document.body.appendChild(resultDiv);
  }
  
  // 显示通知
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${type === 'error' ? '#ff4d4f' : '#1890ff'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizeNews') {
      const newsContent = extractNewsContent();
      if (!newsContent || newsContent.trim().length < 50) {
        sendResponse({ success: false, error: '未能提取到有效的新闻内容' });
        return;
      }
      
      // 显示加载状态
      showLoadingState();
      
      // 发送消息到后台脚本
      chrome.runtime.sendMessage({
        action: 'summarizeNews',
        content: newsContent
      }, (response) => {
        hideLoadingState();
        
        if (response.success) {
          showSummaryResult(response.summary);
          sendResponse({ success: true, summary: response.summary });
        } else {
          showNotification(response.error, 'error');
          sendResponse({ success: false, error: response.error });
        }
      });
      
      return true; // 保持消息通道开放
    }
  });
})();