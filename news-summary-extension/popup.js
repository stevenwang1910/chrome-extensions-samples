let currentTab = null;
let apiConfig = null;

async function loadApiConfig() {
  const result = await chrome.storage.local.get(['apiConfigs', 'defaultApiId']);
  const apiConfigs = result.apiConfigs || [];
  const defaultApiId = result.defaultApiId;
  
  if (apiConfigs.length === 0) {
    return null;
  }
  
  const config = apiConfigs.find(c => c.id === defaultApiId) || apiConfigs[0];
  return config;
}

function isNewsPage(url) {
  return url.includes('163.com') && !url.includes('www.163.com/');
}

async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  if (!currentTab) {
    showError('无法获取当前标签页');
    return;
  }
  
  document.getElementById('pageTitle').textContent = currentTab.title || '无标题';
  document.getElementById('pageUrl').textContent = currentTab.url;
  
  if (!isNewsPage(currentTab.url)) {
    document.getElementById('noNewsCard').classList.add('show');
    document.getElementById('summarizeBtn').disabled = true;
    return;
  }
  
  apiConfig = await loadApiConfig();
  
  if (!apiConfig) {
    document.getElementById('configIndicator').textContent = '⚠️ 未配置API';
    document.getElementById('summarizeBtn').disabled = true;
    showError('请先配置API，点击下方"配置"按钮');
    return;
  }
  
  document.getElementById('configIndicator').textContent = `✓ ${apiConfig.name}`;
}

function showLoading() {
  document.getElementById('loadingCard').classList.add('show');
  document.getElementById('summaryCard').classList.remove('show');
  document.getElementById('errorCard').classList.remove('show');
  document.getElementById('summarizeBtn').disabled = true;
}

function hideLoading() {
  document.getElementById('loadingCard').classList.remove('show');
  document.getElementById('summarizeBtn').disabled = false;
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorCard').classList.add('show');
  document.getElementById('summaryCard').classList.remove('show');
  hideLoading();
}

function showSummary(summary, title) {
  document.getElementById('summaryContent').innerHTML = summary.replace(/\n/g, '<br>');
  document.getElementById('originalTitle').textContent = title;
  document.getElementById('summaryCard').classList.add('show');
  document.getElementById('errorCard').classList.remove('show');
  hideLoading();
}

async function extractNewsContent() {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => {
        const title = document.querySelector('h1.post_title')?.textContent.trim() || 
                      document.querySelector('h1')?.textContent.trim() || 
                      document.title;
        
        let content = '';
        
        const bodyDiv = document.querySelector('div.post_body');
        if (bodyDiv) {
          const paragraphs = bodyDiv.querySelectorAll('p');
          content = Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(p => p && p.length > 10)
            .join('\n');
        } else {
          const articleContent = document.querySelector('article') || 
                                 document.querySelector('.article-content') ||
                                 document.querySelector('#articleContent');
          
          if (articleContent) {
            const paragraphs = articleContent.querySelectorAll('p');
            content = Array.from(paragraphs)
              .map(p => p.textContent.trim())
              .filter(p => p && p.length > 10)
              .join('\n');
          } else {
            const allParagraphs = document.querySelectorAll('p');
            content = Array.from(allParagraphs)
              .map(p => p.textContent.trim())
              .filter(p => p && p.length > 50)
              .slice(0, 20)
              .join('\n');
          }
        }
        
        return {
          title: title,
          content: content,
          hasContent: content.length > 100
        };
      }
    });
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    
    return { title: '', content: '', hasContent: false };
  } catch (error) {
    console.error('提取新闻内容失败:', error);
    return { title: '', content: '', hasContent: false };
  }
}

async function generateSummary(newsContent) {
  if (!apiConfig) {
    throw new Error('未配置API');
  }
  
  const prompt = `请将以下新闻内容总结成100字以内的摘要，要求：
1. 简洁明了，保留核心信息
2. 使用中文
3. 不超过100字

新闻内容：
${newsContent}`;
  
  try {
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
        temperature: 0.7,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    }
    
    throw new Error('API返回格式错误');
  } catch (error) {
    console.error('调用API失败:', error);
    throw error;
  }
}

async function handleSummarize() {
  showLoading();
  
  try {
    const newsData = await extractNewsContent();
    
    if (!newsData.hasContent) {
      showError('无法提取新闻内容，请确保在新闻详情页使用本扩展');
      return;
    }
    
    const summary = await generateSummary(newsData.content);
    showSummary(summary, newsData.title);
    
  } catch (error) {
    console.error('生成摘要失败:', error);
    showError(`生成摘要失败: ${error.message}`);
  }
}

function handleConfig() {
  chrome.runtime.openOptionsPage();
  window.close();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  
  document.getElementById('summarizeBtn').addEventListener('click', handleSummarize);
  document.getElementById('configBtn').addEventListener('click', handleConfig);
  document.getElementById('openOptions').addEventListener('click', (e) => {
    e.preventDefault();
    handleConfig();
  });
});
