// 侧边栏脚本

let currentArticleData = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 绑定事件
  document.getElementById('summarizeBtn').addEventListener('click', summarizeCurrentPage);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('copyBtn').addEventListener('click', copySummary);
  document.getElementById('regenerateBtn').addEventListener('click', regenerateSummary);
  document.getElementById('retryBtn').addEventListener('click', summarizeCurrentPage);

  // 检查当前标签页是否为新闻页面
  checkCurrentTab();
});

// 检查当前标签页
async function checkCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // 检查是否是支持的页面
    const isNewsPage = isSupportedNewsSite(tab.url);
    const summarizeBtn = document.getElementById('summarizeBtn');
    
    if (!isNewsPage) {
      summarizeBtn.disabled = true;
      summarizeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        请在新闻页面使用
      `;
    }
  } catch (error) {
    console.error('检查标签页失败:', error);
  }
}

// 判断是否支持的新闻网站
function isSupportedNewsSite(url) {
  if (!url) return false;
  
  const supportedPatterns = [
    /163\.com/,      // 网易
    /sina\.com/,     // 新浪
    /sohu\.com/,     // 搜狐
    /qq\.com/,       // 腾讯
    /ifeng\.com/,    // 凤凰
    /people\.com/,   // 人民网
    /xinhuanet\.com/, // 新华网
    /chinadaily\.com/, // 中国日报
    /thepaper\.cn/,  // 澎湃新闻
    /jiemian\.com/,  // 界面
    /huxiu\.com/,    // 虎嗅
    /36kr\.com/,     // 36氪
    /cnbeta\.com/,   // cnBeta
    /techcrunch\.com/, // TechCrunch
    /bbc\.com/,      // BBC
    /cnn\.com/,      // CNN
    /reuters\.com/,  // Reuters
  ];

  return supportedPatterns.some(pattern => pattern.test(url));
}

// 总结当前页面
async function summarizeCurrentPage() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  
  try {
    // 显示加载状态
    showLoading();
    summarizeBtn.disabled = true;

    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('无法获取当前页面');
    }

    // 注入内容脚本并提取内容
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error('无法提取页面内容');
    }

    const articleData = results[0].result;
    
    // 验证内容
    if (!articleData.content || articleData.content.length < 100) {
      throw new Error('页面内容不足，可能不是新闻文章页面');
    }

    currentArticleData = articleData;

    // 发送到后台进行总结
    const response = await chrome.runtime.sendMessage({
      action: 'summarize',
      data: articleData
    });

    if (response.success) {
      showResult(response.data);
    } else {
      throw new Error(response.error || '生成摘要失败');
    }

  } catch (error) {
    console.error('总结失败:', error);
    showError(error.message);
  } finally {
    summarizeBtn.disabled = false;
  }
}

// 在页面中执行的提取函数
function extractPageContent() {
  // 这个函数会在内容脚本上下文中执行
  // 尝试多种方式提取内容
  
  const result = {
    title: document.title,
    content: '',
    url: window.location.href,
    source: '',
    publishTime: ''
  };

  // 提取标题
  const titleSelectors = [
    'h1.article-title',
    'h1.post_title', 
    'h1.entry-title',
    'h1.news-title',
    'h1.title',
    '.article-title',
    '.post_title',
    'article h1',
    'header h1'
  ];
  
  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      result.title = el.textContent.trim();
      break;
    }
  }

  // 提取来源
  const sourceSelectors = [
    '.article-source',
    '.post_source',
    '.source',
    '.author',
    'meta[name="author"]'
  ];
  
  for (const selector of sourceSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      result.source = el.textContent.trim() || el.getAttribute('content') || '';
      break;
    }
  }

  // 提取时间
  const timeSelectors = [
    'time[datetime]',
    '.article-time',
    '.post_time',
    '.publish-time',
    'meta[property="article:published_time"]'
  ];
  
  for (const selector of timeSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      result.publishTime = el.getAttribute('datetime') || 
                          el.getAttribute('content') || 
                          el.textContent.trim();
      break;
    }
  }

  // 提取正文
  const contentSelectors = [
    '.post_body',
    '.article-content',
    '.entry-content',
    '.news-content',
    '#article-content',
    'article',
    '.main-content',
    '.detail-content'
  ];

  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      // 克隆并清理
      const clone = el.cloneNode(true);
      const scripts = clone.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ad, .comments, .related, .share');
      scripts.forEach(s => s.remove());
      
      let text = clone.textContent || '';
      text = text.replace(/\s+/g, ' ').trim();
      
      if (text.length > 200) {
        result.content = text;
        break;
      }
    }
  }

  // 如果还没找到，尝试从段落中提取
  if (!result.content) {
    const paragraphs = document.querySelectorAll('p');
    let maxText = '';
    
    paragraphs.forEach(p => {
      const parent = p.parentElement;
      if (parent) {
        const text = parent.textContent || '';
        if (text.length > maxText.length && text.length > 200) {
          maxText = text;
        }
      }
    });
    
    result.content = maxText;
  }

  // 清理内容
  result.content = result.content
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/(分享到|点击|关注|订阅|推荐|广告|推广)[：:].*?(?=\s|$)/gi, '')
    .replace(/(特别声明|版权声明|免责声明|版权所有).*/gi, '')
    .trim();

  return result;
}

// 显示加载状态
function showLoading() {
  hideAllStates();
  document.getElementById('loadingState').classList.remove('hidden');
}

// 显示结果
function showResult(data) {
  hideAllStates();
  
  // 填充数据
  document.getElementById('articleTitle').textContent = data.title || '无标题';
  document.getElementById('articleSource').textContent = data.source || '未知来源';
  document.getElementById('articleTime').textContent = new Date().toLocaleString();
  document.getElementById('summaryContent').textContent = data.summary;
  document.getElementById('summaryLength').textContent = `字数：${data.summary.length} 字`;
  
  document.getElementById('resultState').classList.remove('hidden');
}

// 显示错误
function showError(message) {
  hideAllStates();
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorState').classList.remove('hidden');
}

// 隐藏所有状态
function hideAllStates() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

// 打开设置页面
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// 复制摘要
async function copySummary() {
  const summary = document.getElementById('summaryContent').textContent;
  
  try {
    await navigator.clipboard.writeText(summary);
    showToast('已复制到剪贴板', 'success');
  } catch (error) {
    showToast('复制失败', 'error');
  }
}

// 重新生成
async function regenerateSummary() {
  if (currentArticleData) {
    const summarizeBtn = document.getElementById('summarizeBtn');
    summarizeBtn.click();
  }
}

// 显示提示
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
