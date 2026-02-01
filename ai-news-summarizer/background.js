// 后台脚本，处理扩展的主要逻辑
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI新闻总结助手已安装');
  
  // 初始化默认配置
  chrome.storage.sync.get(['apiConfigs'], (result) => {
    if (!result.apiConfigs) {
      const defaultConfigs = [
        {
          id: 'default',
          name: '默认API',
          url: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-3.5-turbo',
          apiKey: '',
          enabled: true
        }
      ];
      chrome.storage.sync.set({ apiConfigs: defaultConfigs });
    }
  });
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarizeNews') {
    handleNewsSummary(request.content, sendResponse);
    return true; // 保持消息通道开放
  }
});

// 处理新闻总结
async function handleNewsSummary(content, sendResponse) {
  try {
    // 获取API配置
    chrome.storage.sync.get(['apiConfigs'], async (result) => {
      const apiConfigs = result.apiConfigs || [];
      const enabledConfig = apiConfigs.find(config => config.enabled);
      
      if (!enabledConfig || !enabledConfig.apiKey) {
        sendResponse({ 
          success: false, 
          error: '请先配置有效的API密钥' 
        });
        return;
      }
      
      // 调用AI API进行总结
      const summary = await callAIAPI(enabledConfig, content);
      sendResponse({ success: true, summary });
    });
  } catch (error) {
    console.error('总结过程中出错:', error);
    sendResponse({ 
      success: false, 
      error: '总结失败: ' + error.message 
    });
  }
}

// 调用AI API
async function callAIAPI(config, content) {
  const prompt = `请将以下新闻内容总结为100字以内的摘要：\n\n${content}`;
  
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
}