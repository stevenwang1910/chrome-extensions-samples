let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

function extractContent() {
  // 适配网易新闻页面结构
  const title = document.querySelector('h1.post_title')?.textContent.trim();
  const postBody = document.querySelector('.post_body');
  
  if (!title || !postBody) {
    return null;
  }
  
  // 创建新的内容容器，只保留文本内容
  const content = document.createElement('div');
  content.className = 'post_body';
  
  // 遍历postBody的所有子节点，包括文本节点
  const childNodes = postBody.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    
    // 只保留元素节点
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    
    const tagName = node.tagName;
    
    // 只保留段落、图片和figure元素
    if (tagName === 'P' || tagName === 'IMG' || tagName === 'FIGURE') {
      // 深入检查p标签内容，排除脚本和样式代码
      if (tagName === 'P') {
        const textContent = node.textContent.trim();
        // 排除包含CSS、JavaScript代码的段落
        if (textContent.includes('{') && textContent.includes('}') && 
            (textContent.includes('.') || textContent.includes('#') || 
             textContent.includes('var') || textContent.includes('function') ||
             textContent.includes('=') || textContent.includes(':'))) {
          continue;
        }
      }
      
      // 克隆节点但不复制任何属性
      const clone = document.createElement(node.tagName.toLowerCase());
      
      // 只复制文本内容（针对p标签）
      if (tagName === 'P') {
        clone.textContent = node.textContent;
      } else if (tagName === 'IMG') {
        // 对于图片，只复制src属性
        const src = node.getAttribute('src');
        if (src) {
          clone.setAttribute('src', src);
        }
        // 可以选择性地复制其他必要属性
        const alt = node.getAttribute('alt');
        if (alt) {
          clone.setAttribute('alt', alt);
        }
      } else if (tagName === 'FIGURE') {
        // 对于figure标签，递归处理其子元素
        const figureChildNodes = node.childNodes;
        for (let j = 0; j < figureChildNodes.length; j++) {
          const figureNode = figureChildNodes[j];
          if (figureNode.nodeType === Node.ELEMENT_NODE) {
            const figureClone = document.createElement(figureNode.tagName.toLowerCase());
            if (figureNode.tagName === 'IMG') {
              const src = figureNode.getAttribute('src');
              if (src) {
                figureClone.setAttribute('src', src);
              }
              const alt = figureNode.getAttribute('alt');
              if (alt) {
                figureClone.setAttribute('alt', alt);
              }
            } else if (figureNode.tagName === 'FIGCAPTION') {
              figureClone.textContent = figureNode.textContent;
            }
            clone.appendChild(figureClone);
          }
        }
      }
      
      content.appendChild(clone);
    }
  }
  
  // 如果没有提取到内容，尝试直接获取文本
  if (content.children.length === 0) {
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
  document.body.style.cssText = 'margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Helvetica Neue\', Helvetica, Arial, sans-serif;';
  
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
