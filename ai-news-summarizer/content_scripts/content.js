// 内容脚本 - 提取新闻页面内容

// 提取页面内容的函数
function extractNewsContent() {
  const result = {
    title: '',
    content: '',
    url: window.location.href,
    source: '',
    publishTime: ''
  };

  // 提取标题
  result.title = extractTitle();
  
  // 提取来源
  result.source = extractSource();
  
  // 提取发布时间
  result.publishTime = extractPublishTime();
  
  // 提取正文内容
  result.content = extractMainContent();

  return result;
}

// 提取标题
function extractTitle() {
  // 尝试多种方式获取标题
  const selectors = [
    'h1.article-title',
    'h1.post_title',
    'h1.entry-title',
    'h1.news-title',
    'h1.title',
    '.article-title',
    '.post_title',
    '.news-title',
    'article h1',
    'header h1',
    'h1'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      return el.textContent.trim();
    }
  }

  // 回退到document.title
  return document.title.replace(/[-_|].*$/, '').trim();
}

// 提取来源
function extractSource() {
  const selectors = [
    '.article-source',
    '.post_source',
    '.source',
    '.author',
    '.article-author',
    '[rel="author"]',
    'meta[name="author"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      return el.textContent.trim() || el.getAttribute('content') || '';
    }
  }

  // 从域名推断
  const hostname = window.location.hostname;
  return hostname.replace(/^www\./, '');
}

// 提取发布时间
function extractPublishTime() {
  const selectors = [
    'time[datetime]',
    '.article-time',
    '.post_time',
    '.publish-time',
    '.date',
    'meta[property="article:published_time"]',
    'meta[name="publishdate"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const time = el.getAttribute('datetime') || 
                   el.getAttribute('content') || 
                   el.textContent.trim();
      if (time) return time;
    }
  }

  return '';
}

// 提取正文内容 - 使用多种策略
function extractMainContent() {
  let content = '';

  // 策略1：针对网易新闻等常见新闻网站的特定选择器
  const newsSelectors = [
    '.post_body',           // 网易新闻
    '.article-content',     // 通用
    '.entry-content',       // WordPress等
    '.news-content',        // 通用
    '.content-detail',      // 一些新闻网站
    '#article-content',     // 通用ID
    '.article-text',        // 通用
    'article',              // HTML5 article标签
    '.main-content',        // 通用
    '#content',             // 通用ID
    '.detail-content',      // 一些中文新闻网站
    '.text-content'         // 通用
  ];

  for (const selector of newsSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = extractTextFromElement(el);
      if (text.length > 200) {
        content = text;
        break;
      }
    }
  }

  // 策略2：如果没有找到足够内容，使用正文密度算法
  if (content.length < 200) {
    content = extractByDensity();
  }

  // 清理内容
  content = cleanContent(content);

  return content;
}

// 从元素中提取文本
function extractTextFromElement(element) {
  // 克隆元素以避免修改原页面
  const clone = element.cloneNode(true);
  
  // 移除脚本、样式、导航等无关元素
  const removeSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.advertisement',
    '.ad',
    '.comments',
    '.related',
    '.share',
    '.toolbar',
    '.sidebar',
    '.recommend',
    '.post_recommends',
    '.post_comment',
    '.post_next',
    '.post_statement'
  ];

  removeSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // 获取文本内容
  let text = clone.textContent || '';
  
  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// 基于正文密度提取内容
function extractByDensity() {
  const paragraphs = document.querySelectorAll('p');
  let bestText = '';
  let maxScore = 0;

  // 遍历所有段落，找到内容最丰富的区域
  paragraphs.forEach(p => {
    const parent = p.parentElement;
    if (!parent) return;

    const text = parent.textContent || '';
    const links = parent.querySelectorAll('a');
    const linkText = Array.from(links).map(a => a.textContent).join('');
    
    // 计算文本密度（非链接文本比例）
    const textLength = text.length;
    const linkLength = linkText.length;
    const density = textLength > 0 ? (textLength - linkLength) / textLength : 0;
    
    // 评分：文本长度 * 密度
    const score = textLength * density;

    if (score > maxScore && textLength > 200) {
      maxScore = score;
      bestText = text;
    }
  });

  return bestText;
}

// 清理内容
function cleanContent(text) {
  return text
    // 移除多余的空白字符
    .replace(/\s+/g, ' ')
    // 移除特殊字符
    .replace(/[\n\r\t]/g, ' ')
    // 移除连续的空格
    .replace(/\s{2,}/g, ' ')
    // 移除常见的广告/推广文本
    .replace(/(分享到|点击|关注|订阅|推荐|广告|推广)[：:].*?(?=\s|$)/gi, '')
    // 移除版权声明
    .replace(/(特别声明|版权声明|免责声明|版权所有).*/gi, '')
    // 移除多余的标点
    .replace(/[。！？]{3,}/g, '。')
    // 最终修剪
    .trim();
}

// 监听来自background或sidepanel的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    const content = extractNewsContent();
    sendResponse({ success: true, data: content });
  }
  return true;
});

// 页面加载完成后，通知扩展已就绪
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'contentScriptReady' });
});
