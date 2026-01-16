let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

function extractContent() {
  // 适配网易新闻页面结构
  const title = document.querySelector('h1.post_title')?.textContent.trim();
  const postBody = document.querySelector('.post_body');
  
  if (!title || !postBody) {
    console.log('[Pure Reading] 未能找到标题或内容区域');
    return null;
  }
  
  console.log('[Pure Reading] 找到内容区域');
  
  // 创建新的内容容器，只保留文本内容
  const content = document.createElement('div');
  content.className = 'post_body';
  
  // 获取所有直接子元素和嵌套的元素
  const allElements = postBody.querySelectorAll('p, img, figure, figcaption, ul, ol, li');
  console.log('[Pure Reading] 找到元素数量:', allElements.length);
  
  // 使用Set来避免重复处理
  const processedElements = new Set();
  
  for (let i = 0; i < allElements.length; i++) {
    const node = allElements[i];
    const tagName = node.tagName;
    
    // 如果节点已经被处理过（作为父元素的子元素），跳过
    if (processedElements.has(node)) {
      continue;
    }
    
    console.log('[Pure Reading] 处理元素:', tagName);
    
    // 对于figure，直接处理整个figure
    if (tagName === 'FIGURE') {
      const clone = document.createElement('figure');
      const figureChildren = node.querySelectorAll('img, figcaption');
      
      for (let j = 0; j < figureChildren.length; j++) {
        const child = figureChildren[j];
        processedElements.add(child);
        
        if (child.tagName === 'IMG') {
          const imgClone = document.createElement('img');
          let src = child.getAttribute('src') || child.getAttribute('data-src') || child.getAttribute('data-original');
          if (src) {
            try {
              const url = new URL(src, window.location.href);
              imgClone.setAttribute('src', url.href);
            } catch (e) {
              imgClone.setAttribute('src', src);
            }
          }
          const alt = child.getAttribute('alt') || '';
          if (alt) {
            imgClone.setAttribute('alt', alt);
          }
          imgClone.style.maxWidth = '100%';
          imgClone.style.height = 'auto';
          imgClone.style.display = 'block';
          imgClone.style.margin = '0 auto';
          imgClone.style.borderRadius = '4px';
          clone.appendChild(imgClone);
        } else if (child.tagName === 'FIGCAPTION') {
          const capClone = document.createElement('figcaption');
          capClone.textContent = child.textContent;
          capClone.style.fontSize = '14px';
          capClone.style.color = '#666';
          capClone.style.marginTop = '10px';
          capClone.style.fontStyle = 'italic';
          capClone.style.textAlign = 'center';
          clone.appendChild(capClone);
        }
      }
      
      content.appendChild(clone);
      continue;
    }
    
    // 对于列表，直接处理整个列表
    if (tagName === 'UL' || tagName === 'OL') {
      // 检查是否已经作为子元素处理
      if (node.parentNode && processedElements.has(node.parentNode)) {
        continue;
      }
      
      const clone = document.createElement(tagName.toLowerCase());
      const items = node.querySelectorAll('li');
      
      for (let j = 0; j < items.length; j++) {
        processedElements.add(items[j]);
        const liClone = document.createElement('li');
        liClone.textContent = items[j].textContent;
        clone.appendChild(liClone);
      }
      
      content.appendChild(clone);
      continue;
    }
    
    // 对于独立的图片
    if (tagName === 'IMG') {
      // 检查是否在figure中
      if (node.closest('figure')) {
        continue;
      }
      
      const clone = document.createElement('img');
      let src = node.getAttribute('src') || node.getAttribute('data-src') || node.getAttribute('data-original');
      if (src) {
        try {
          const url = new URL(src, window.location.href);
          clone.setAttribute('src', url.href);
        } catch (e) {
          clone.setAttribute('src', src);
        }
      }
      const alt = node.getAttribute('alt') || '';
      if (alt) {
        clone.setAttribute('alt', alt);
      }
      clone.style.maxWidth = '100%';
      clone.style.height = 'auto';
      clone.style.display = 'block';
      clone.style.margin = '30px auto';
      clone.style.borderRadius = '4px';
      content.appendChild(clone);
      continue;
    }
    
    // 对于段落
    if (tagName === 'P') {
      // 检查是否在其他元素中
      if (node.closest('figure, ul, ol')) {
        continue;
      }
      
      const textContent = node.textContent.trim();
      // 排除包含CSS、JavaScript代码的段落
      if (textContent.includes('{') && textContent.includes('}') && 
          (textContent.includes('.') || textContent.includes('#') || 
           textContent.includes('var') || textContent.includes('function') ||
           textContent.includes('=') || textContent.includes(':'))) {
        continue;
      }
      
      if (textContent) {
        const clone = document.createElement('p');
        clone.textContent = node.textContent;
        content.appendChild(clone);
      }
    }
  }
  
  // 如果没有提取到内容，尝试直接获取文本
  if (content.children.length === 0) {
    console.log('[Pure Reading] 没有找到任何有效内容');
    const text = postBody.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      content.appendChild(p);
    } else {
      return null;
    }
  }
  
  return { title, content };
}

function enterPureMode() {
  const content = extractContent();
  
  if (!content) {
    return false;
  }
  
  isPureMode = true;
  document.documentElement.classList.add(PURE_MODE_CLASS);
  
  // 完全清空body
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Helvetica Neue\', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;';
  
  // 创建纯净阅读容器
  const pureContainer = document.createElement('div');
  pureContainer.id = 'pure-reading-container';
  pureContainer.style.cssText = 'width: 100%; min-height: 100vh; padding: 40px 20px; box-sizing: border-box;';
  
  // 创建内容容器
  const pureContent = document.createElement('div');
  pureContent.className = 'pure-reading-content';
  pureContent.style.cssText = 'max-width: 800px; margin: 0 auto; background: white; padding: 60px 80px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border-radius: 8px;';
  
  // 创建标题
  const pureTitle = document.createElement('h1');
  pureTitle.className = 'pure-reading-title';
  pureTitle.textContent = content.title;
  pureTitle.style.cssText = 'font-size: 32px; font-weight: 600; line-height: 1.3; color: #333; margin-bottom: 30px; text-align: left;';
  
  // 创建正文容器
  const pureBody = document.createElement('div');
  pureBody.className = 'pure-reading-body';
  pureBody.style.cssText = 'font-size: 18px; line-height: 1.8; color: #333;';
  
  // 添加内容
  pureBody.appendChild(content.content);
  pureContent.appendChild(pureTitle);
  pureContent.appendChild(pureBody);
  pureContainer.appendChild(pureContent);
  document.body.appendChild(pureContainer);
  
  // 添加切换按钮
  addToggleButton();
  
  return true;
}

function exitPureMode() {
  isPureMode = false;
  document.documentElement.classList.remove(PURE_MODE_CLASS);
  window.location.reload();
}

function addToggleButton() {
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'pure-reading-toggle';
  toggleBtn.textContent = '退出纯净模式';
  toggleBtn.addEventListener('click', exitPureMode);
  
  document.body.appendChild(toggleBtn);
}

function initPureMode() {
  // 检查是否需要自动进入纯净模式
  if (isPureMode) {
    return;
  }
  
  // 添加切换按钮到页面
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'pure-reading-toggle';
  toggleBtn.textContent = '纯净阅读';
  toggleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 20px;
    background: #ff6600;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  toggleBtn.addEventListener('click', enterPureMode);
  
  document.body.appendChild(toggleBtn);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPureMode);
} else {
  initPureMode();
}
