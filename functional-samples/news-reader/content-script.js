let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

function getRealImageSrc(img) {
  const src = img.getAttribute('src') || '';
  const dataSrc = img.getAttribute('data-src') || '';
  const dataOriginal = img.getAttribute('data-original') || '';
  if (dataOriginal && !dataOriginal.includes('placeholder')) {
    return dataOriginal;
  }
  if (dataSrc && !dataSrc.includes('placeholder')) {
    return dataSrc;
  }
  if (src && !src.includes('placeholder') && !src.includes('data:')) {
    return src;
  }
  return dataSrc || dataOriginal || src;
}

function processMediaElements(container) {
  const imgs = container.querySelectorAll('img');
  imgs.forEach(img => {
    const realSrc = getRealImageSrc(img);
    if (realSrc) {
      img.setAttribute('src', realSrc);
      img.removeAttribute('data-src');
      img.removeAttribute('data-original');
      img.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 20px auto;';
    }
  });
  
  const videos = container.querySelectorAll('video');
  videos.forEach(video => {
    video.style.cssText = 'max-width: 100%; display: block; margin: 20px auto;';
    video.setAttribute('controls', '');
  });
  
  const iframes = container.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    iframe.style.cssText = 'max-width: 100%; display: block; margin: 20px auto;';
  });
}

function cloneElementWithContent(node) {
  const clone = document.createElement(node.tagName.toLowerCase());
  
  if (node.tagName === 'IMG') {
    const realSrc = getRealImageSrc(node);
    if (realSrc) {
      clone.setAttribute('src', realSrc);
    }
    const alt = node.getAttribute('alt');
    if (alt) clone.setAttribute('alt', alt);
    clone.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 20px auto;';
    return clone;
  }
  
  if (node.tagName === 'VIDEO' || node.tagName === 'IFRAME') {
    return node.cloneNode(true);
  }
  
  const childNodes = node.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      clone.appendChild(document.createTextNode(child.textContent));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childTagName = child.tagName;
      if (childTagName === 'IMG') {
        clone.appendChild(cloneElementWithContent(child));
      } else if (childTagName === 'VIDEO' || childTagName === 'IFRAME') {
        clone.appendChild(child.cloneNode(true));
      } else if (['STRONG', 'EM', 'B', 'I', 'A', 'SPAN', 'BR'].includes(childTagName)) {
        const innerClone = document.createElement(childTagName.toLowerCase());
        if (childTagName === 'A') {
          const href = child.getAttribute('href');
          if (href) innerClone.setAttribute('href', href);
        }
        innerClone.textContent = child.textContent;
        clone.appendChild(innerClone);
      } else {
        clone.appendChild(cloneElementWithContent(child));
      }
    }
  }
  
  return clone;
}

function extractContent() {
  const title = document.querySelector('h1.post_title')?.textContent.trim();
  const postBody = document.querySelector('.post_body');
  
  if (!title || !postBody) {
    return null;
  }
  
  const content = document.createElement('div');
  content.className = 'post_body';
  
  const childNodes = postBody.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    
    const tagName = node.tagName;
    const className = (node.className || '').toString();
    
    if (tagName === 'P') {
      const textContent = node.textContent.trim();
      if (textContent.includes('{') && textContent.includes('}') && 
          (textContent.includes('.') || textContent.includes('#') || 
           textContent.includes('var') || textContent.includes('function') ||
           textContent.includes('=') || textContent.includes(':'))) {
        continue;
      }
      
      const hasImg = node.querySelector('img');
      if (hasImg) {
        const clone = cloneElementWithContent(node);
        content.appendChild(clone);
      } else {
        const clone = cloneElementWithContent(node);
        content.appendChild(clone);
      }
    } else if (tagName === 'IMG') {
      const clone = cloneElementWithContent(node);
      content.appendChild(clone);
    } else if (tagName === 'FIGURE' || tagName === 'PICTURE') {
      const clone = node.cloneNode(true);
      processMediaElements(clone);
      content.appendChild(clone);
    } else if (tagName === 'DIV' && className) {
      const hasMedia = node.querySelector('img, video, iframe');
      if (hasMedia) {
        const clone = node.cloneNode(true);
        processMediaElements(clone);
        content.appendChild(clone);
      }
    } else if (tagName === 'VIDEO' || tagName === 'IFRAME') {
      const clone = node.cloneNode(true);
      content.appendChild(clone);
    }
  }
  
  processMediaElements(content);
  
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
  document.documentElement.classList.remove(PURE_MODE_CLASS);
  
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
