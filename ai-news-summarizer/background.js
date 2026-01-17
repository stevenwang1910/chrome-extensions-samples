// AI新闻总结小助手 - 后台脚本
// 处理扩展的后台逻辑

(function() {
  'use strict';

  // 监听扩展安装事件
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('AI新闻总结小助手已安装');
      // 初始化默认配置
      chrome.storage.local.set({
        apiConfigs: [],
        settings: {
          maxSummaryLength: 100,
          autoExtract: false
        }
      });
    } else if (details.reason === 'update') {
      console.log('AI新闻总结小助手已更新');
    }
  });

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiConfigs') {
      chrome.storage.local.get(['apiConfigs'], (result) => {
        sendResponse(result.apiConfigs || []);
      });
      return true;
    }

    if (request.action === 'saveApiConfig') {
      chrome.storage.local.get(['apiConfigs'], (result) => {
        const configs = result.apiConfigs || [];
        const existingIndex = configs.findIndex(c => c.id === request.config.id);
        
        if (existingIndex >= 0) {
          configs[existingIndex] = request.config;
        } else {
          configs.push(request.config);
        }
        
        chrome.storage.local.set({ apiConfigs: configs }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    }

    if (request.action === 'deleteApiConfig') {
      chrome.storage.local.get(['apiConfigs'], (result) => {
        const configs = result.apiConfigs || [];
        const newConfigs = configs.filter(c => c.id !== request.id);
        
        chrome.storage.local.set({ apiConfigs: newConfigs }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    }

    if (request.action === 'clearApiConfigs') {
      chrome.storage.local.set({ apiConfigs: [] }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  });

  // 监听标签页更新事件
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // 检查是否是新闻网站
      if (tab.url.match(/^(https?:\/\/)?(www\.)?(163\.com|sina\.com\.cn|qq\.com|sohu\.com)/)) {
        // 可以在这里执行一些自动操作，比如显示页面操作按钮
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            16: 'icon16.png',
            48: 'icon48.png',
            128: 'icon128.png'
          }
        });
        
        chrome.action.setBadgeText({
          tabId: tabId,
          text: 'AI'
        });
        
        chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: '#667eea'
        });
      }
    }
  });

  // 监听标签页激活事件
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url && tab.url.match(/^(https?:\/\/)?(www\.)?(163\.com|sina\.com\.cn|qq\.com|sohu\.com)/)) {
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: 'AI'
        });
      } else {
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: ''
        });
      }
    });
  });

  console.log('AI新闻总结小助手后台脚本已加载');
})();