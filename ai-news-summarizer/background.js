// 后台服务脚本

// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI新闻总结助手已安装');
});

// 点击扩展图标时打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// 监听来自内容脚本和侧边栏的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    handleSummarize(request.data, sendResponse);
    return true; // 保持消息通道开启
  }
  
  if (request.action === 'getActiveApi') {
    getActiveApiConfig().then(sendResponse);
    return true;
  }
  
  if (request.action === 'testApi') {
    testApiConnection(request.config).then(sendResponse);
    return true;
  }
});

// 处理总结请求
async function handleSummarize(articleData, sendResponse) {
  try {
    // 获取活跃的API配置
    const apiConfig = await getActiveApiConfig();
    
    if (!apiConfig) {
      sendResponse({ 
        success: false, 
        error: '未配置API，请先前往扩展选项页面配置' 
      });
      return;
    }

    // 构建提示词
    const prompt = buildSummaryPrompt(articleData);
    
    // 调用API
    const summary = await callLLMApi(apiConfig, prompt);
    
    sendResponse({ 
      success: true, 
      data: {
        summary: summary,
        title: articleData.title,
        source: articleData.source,
        url: articleData.url
      }
    });
  } catch (error) {
    console.error('总结失败:', error);
    sendResponse({ 
      success: false, 
      error: error.message || '总结失败，请检查API配置' 
    });
  }
}

// 构建总结提示词
function buildSummaryPrompt(articleData) {
  const { title, content, source, publishTime } = articleData;
  
  // 截取内容，避免过长
  const maxContentLength = 3000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...'
    : content;

  return `请对以下新闻文章进行总结，要求：
1. 总结内容控制在100字以内
2. 包含文章的核心要点
3. 语言简洁明了
4. 使用中文回答

文章标题：${title}
${source ? `来源：${source}` : ''}
${publishTime ? `发布时间：${publishTime}` : ''}

文章内容：
${truncatedContent}

请提供总结：`;
}

// 获取活跃的API配置
async function getActiveApiConfig() {
  const result = await chrome.storage.sync.get(['apiConfigs']);
  const configs = result.apiConfigs || [];
  
  // 找到标记为active的配置
  const activeConfig = configs.find(c => c.isActive);
  
  // 如果没有active的，返回第一个
  if (!activeConfig && configs.length > 0) {
    return configs[0];
  }
  
  return activeConfig;
}

// 调用大模型API
async function callLLMApi(config, prompt) {
  const { url, model, key, customModel } = config;
  
  const actualModel = model === 'custom' ? customModel : model;
  
  if (!url || !key) {
    throw new Error('API配置不完整，请检查URL和Key');
  }

  const requestBody = {
    model: actualModel,
    messages: [
      {
        role: 'system',
        content: '你是一个专业的新闻摘要助手，擅长提取文章核心内容并生成简洁的摘要。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 处理不同的响应格式
    let content = '';
    if (data.choices && data.choices[0]) {
      // OpenAI格式
      content = data.choices[0].message?.content || data.choices[0].text || '';
    } else if (data.content) {
      // 其他格式
      content = data.content;
    } else if (data.response) {
      content = data.response;
    }

    return content.trim();
  } catch (error) {
    console.error('API调用错误:', error);
    throw new Error(`API调用失败: ${error.message}`);
  }
}

// 测试API连接
async function testApiConnection(config) {
  try {
    const testPrompt = '请回复"API连接测试成功"，不要添加任何其他内容。';
    const result = await callLLMApi(config, testPrompt);
    
    return {
      success: true,
      message: 'API连接测试成功',
      response: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

// 侧边栏状态管理
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    console.log('侧边栏已连接');
    
    port.onDisconnect.addListener(() => {
      console.log('侧边栏已断开');
    });
  }
});
