// background.js - 处理API请求和总结任务

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    try {
      const summary = await handleSummarizeRequest(request);
      sendResponse({ success: true, summary });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // 保持消息通道开放以支持异步响应
  }
});

// 处理总结请求
async function handleSummarizeRequest(request) {
  // 获取存储的设置
  const settings = await getSettings();
  
  // 获取默认的API提供者配置
  const defaultProvider = settings.providers[settings.defaultProvider];
  if (!defaultProvider) {
    throw new Error('请先在设置中配置默认的API提供者');
  }
  
  // 构建API请求
  const apiUrl = defaultProvider.apiUrl;
  const apiKey = defaultProvider.apiKey;
  const model = defaultProvider.model;
  const maxTokens = parseInt(defaultProvider.maxTokens) || 100;
  const content = request.content;
  const title = request.title;
  
  // 构建提示词
  const prompt = `请将以下新闻文章总结成100字以内的摘要：\n\n标题：${title}\n\n内容：${content}\n\n摘要：`;
  
  // 发送API请求
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  // 提取总结内容
  if (result.choices && result.choices.length > 0) {
    return result.choices[0].message.content.trim();
  } else {
    throw new Error('API返回格式错误');
  }
}

// 获取存储的设置
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['providers', 'defaultProvider'], (result) => {
      resolve({
        providers: result.providers || {},
        defaultProvider: result.defaultProvider || ''
      });
    });
  });
}

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI News Summarizer 已安装');
  
  // 初始化默认设置
  if (details.reason === 'install') {
    const defaultSettings = {
      providers: {},
      defaultProvider: ''
    };
    
    chrome.storage.local.set(defaultSettings, () => {
      console.log('默认设置已初始化');
    });
  }
});