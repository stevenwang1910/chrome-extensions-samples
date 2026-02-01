let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

// 确保页面使用正确的字符编码
function ensureEncoding() {
  const meta = document.querySelector('meta[charset]');
  if (!meta) {
    const charsetMeta = document.createElement('meta');
    charsetMeta.setAttribute('charset', 'UTF-8');
    document.head.appendChild(charsetMeta);
  } else {
    meta.setAttribute('charset', 'UTF-8');
  }
}

function extractContent() {
  // 尝试多种选择器适配不同版本的网易新闻页面结构
  let title = document.querySelector('h1.post_title')?.textContent.trim() ||
              document.querySelector('.post_title h1')?.textContent.trim() ||
              document.querySelector('h1')?.textContent.trim();
              
  let postBody = document.querySelector('.post_body') ||
                 document.querySelector('.post_text') ||
                 document.querySelector('.article-content') ||
                 document.querySelector('.content') ||
                 document.querySelector('article');
  
  // 如果还是找不到内容，尝试更广泛的搜索
  if (!postBody) {
    // 尝试查找包含大量文本的div
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const textLength = div.textContent.trim().length;
      // 如果div包含大量文本（超过500字符），可能是文章正文
      if (textLength > 500 && 
          !div.querySelector('nav') && 
          !div.querySelector('header') && 
          !div.querySelector('footer') &&
          !div.querySelector('.sidebar') &&
          !div.querySelector('.comment')) {
        postBody = div;
        break;
      }
    }
  }
  
  if (!title || !postBody) {
    console.log('无法找到标题或正文内容', { title, postBody });
    return null;
  }
  
  console.log('找到标题和正文', { title, postBody });
  
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
    
    // 只保留段落、图片、figure元素和视频元素
    if (tagName === 'P' || tagName === 'IMG' || tagName === 'FIGURE' || 
        tagName === 'VIDEO' || tagName === 'IFRAME' || tagName === 'DIV' ||
        tagName === 'SECTION' || tagName === 'ARTICLE') {
      
      // 对于DIV、SECTION和ARTICLE，需要进一步检查内容
      if (tagName === 'DIV' || tagName === 'SECTION' || tagName === 'ARTICLE') {
        // 检查是否包含图片或视频
        const hasMedia = node.querySelector('img, video, iframe, figure');
        if (!hasMedia) {
          // 如果不包含媒体元素，检查是否包含大量文本
          const textLength = node.textContent.trim().length;
          if (textLength < 50) {
            continue; // 跳过文本量少的元素
          }
        }
      }
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
        // 保留原始文本内容，包括换行和空格
        clone.textContent = node.textContent;
      } else if (tagName === 'IMG') {
        // 对于图片，复制更多属性以确保正确显示
        const src = node.getAttribute('src');
        if (src) {
          clone.setAttribute('src', src);
          
          // 复理相对路径的图片
          if (src.startsWith('/') || src.startsWith('./')) {
            const baseUri = new URL(window.location.href);
            clone.setAttribute('src', new URL(src, baseUri).href);
          }
        }
        
        // 复制其他重要属性
        const attributes = ['alt', 'width', 'height', 'title', 'data-src', 'data-original'];
        attributes.forEach(attr => {
          const value = node.getAttribute(attr);
          if (value) {
            clone.setAttribute(attr, value);
          }
        });
        
        // 添加错误处理
        clone.onerror = function() {
          this.style.display = 'none';
          const errorText = document.createElement('div');
          errorText.className = 'image-error';
          errorText.textContent = '图片加载失败';
          errorText.style.cssText = 'color: #999; font-style: italic; text-align: center; padding: 10px;';
          this.parentNode.insertBefore(errorText, this.nextSibling);
        };
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
      } else if (tagName === 'VIDEO') {
        // 处理视频元素
        const src = node.getAttribute('src');
        if (src) {
          clone.setAttribute('src', src);
          
          // 处理相对路径
          if (src.startsWith('/') || src.startsWith('./')) {
            const baseUri = new URL(window.location.href);
            clone.setAttribute('src', new URL(src, baseUri).href);
          }
        }
        
        // 复制其他重要属性
        const attributes = ['controls', 'autoplay', 'muted', 'loop', 'poster', 'width', 'height'];
        attributes.forEach(attr => {
          if (node.hasAttribute(attr)) {
            clone.setAttribute(attr, node.getAttribute(attr));
          }
        });
        
        // 确保有controls属性
        if (!clone.hasAttribute('controls')) {
          clone.setAttribute('controls', '');
        }
        
        // 处理source子元素
        const sourceNodes = node.querySelectorAll('source');
        sourceNodes.forEach(sourceNode => {
          const sourceClone = document.createElement('source');
          const sourceSrc = sourceNode.getAttribute('src');
          if (sourceSrc) {
            if (sourceSrc.startsWith('/') || sourceSrc.startsWith('./')) {
              const baseUri = new URL(window.location.href);
              sourceClone.setAttribute('src', new URL(sourceSrc, baseUri).href);
            } else {
              sourceClone.setAttribute('src', sourceSrc);
            }
          }
          
          const type = sourceNode.getAttribute('type');
          if (type) {
            sourceClone.setAttribute('type', type);
          }
          
          clone.appendChild(sourceClone);
        });
      } else if (tagName === 'IFRAME') {
        // 处理iframe元素（通常用于嵌入视频）
        const src = node.getAttribute('src');
        if (src) {
          clone.setAttribute('src', src);
          
          // 处理相对路径
          if (src.startsWith('/') || src.startsWith('./')) {
            const baseUri = new URL(window.location.href);
            clone.setAttribute('src', new URL(src, baseUri).href);
          }
        }
        
        // 复制其他重要属性
        const attributes = ['width', 'height', 'frameborder', 'allowfullscreen', 'title'];
        attributes.forEach(attr => {
          if (node.hasAttribute(attr)) {
            clone.setAttribute(attr, node.getAttribute(attr));
          }
        });
        
        // 确保有基本的样式
        clone.style.cssText = 'max-width: 100%; height: auto; border: none;';
      } else if (tagName === 'DIV' || tagName === 'SECTION' || tagName === 'ARTICLE') {
        // 处理包含媒体元素的容器
        const mediaElements = node.querySelectorAll('img, video, iframe, figure, p');
        
        if (mediaElements.length > 0) {
          // 如果有媒体元素或段落，直接复制它们
          mediaElements.forEach(mediaNode => {
            const mediaTagName = mediaNode.tagName;
            let mediaClone;
            
            if (mediaTagName === 'IMG') {
              mediaClone = document.createElement('img');
              const src = mediaNode.getAttribute('src');
              if (src) {
                if (src.startsWith('/') || src.startsWith('./')) {
                  const baseUri = new URL(window.location.href);
                  mediaClone.setAttribute('src', new URL(src, baseUri).href);
                } else {
                  mediaClone.setAttribute('src', src);
                }
              }
              
              // 复制其他重要属性
              const attributes = ['alt', 'width', 'height', 'title', 'data-src', 'data-original'];
              attributes.forEach(attr => {
                const value = mediaNode.getAttribute(attr);
                if (value) {
                  mediaClone.setAttribute(attr, value);
                }
              });
            } else if (mediaTagName === 'VIDEO') {
              mediaClone = document.createElement('video');
              const src = mediaNode.getAttribute('src');
              if (src) {
                if (src.startsWith('/') || src.startsWith('./')) {
                  const baseUri = new URL(window.location.href);
                  mediaClone.setAttribute('src', new URL(src, baseUri).href);
                } else {
                  mediaClone.setAttribute('src', src);
                }
              }
              
              // 复制其他重要属性
              const attributes = ['controls', 'autoplay', 'muted', 'loop', 'poster', 'width', 'height'];
              attributes.forEach(attr => {
                if (mediaNode.hasAttribute(attr)) {
                  mediaClone.setAttribute(attr, mediaNode.getAttribute(attr));
                }
              });
              
              // 确保有controls属性
              if (!mediaClone.hasAttribute('controls')) {
                mediaClone.setAttribute('controls', '');
              }
            } else if (mediaTagName === 'IFRAME') {
              mediaClone = document.createElement('iframe');
              const src = mediaNode.getAttribute('src');
              if (src) {
                if (src.startsWith('/') || src.startsWith('./')) {
                  const baseUri = new URL(window.location.href);
                  mediaClone.setAttribute('src', new URL(src, baseUri).href);
                } else {
                  mediaClone.setAttribute('src', src);
                }
              }
              
              // 复制其他重要属性
              const attributes = ['width', 'height', 'frameborder', 'allowfullscreen', 'title'];
              attributes.forEach(attr => {
                if (mediaNode.hasAttribute(attr)) {
                  mediaClone.setAttribute(attr, mediaNode.getAttribute(attr));
                }
              });
              
              mediaClone.style.cssText = 'max-width: 100%; height: auto; border: none;';
            } else if (mediaTagName === 'FIGURE') {
              mediaClone = document.createElement('figure');
              // 处理figure内容
              const figureChildNodes = mediaNode.childNodes;
              for (let j = 0; j < figureChildNodes.length; j++) {
                const figureNode = figureChildNodes[j];
                if (figureNode.nodeType === Node.ELEMENT_NODE) {
                  const figureChildClone = document.createElement(figureNode.tagName.toLowerCase());
                  if (figureNode.tagName === 'IMG') {
                    const src = figureNode.getAttribute('src');
                    if (src) {
                      if (src.startsWith('/') || src.startsWith('./')) {
                        const baseUri = new URL(window.location.href);
                        figureChildClone.setAttribute('src', new URL(src, baseUri).href);
                      } else {
                        figureChildClone.setAttribute('src', src);
                      }
                    }
                    
                    const alt = figureNode.getAttribute('alt');
                    if (alt) {
                      figureChildClone.setAttribute('alt', alt);
                    }
                  } else if (figureNode.tagName === 'FIGCAPTION') {
                    figureChildClone.textContent = figureNode.textContent;
                  }
                  mediaClone.appendChild(figureChildClone);
                }
              }
            } else if (mediaTagName === 'P') {
              mediaClone = document.createElement('p');
              mediaClone.textContent = mediaNode.textContent;
            }
            
            if (mediaClone) {
              content.appendChild(mediaClone);
            }
          });
        } else {
          // 如果没有媒体元素但有大量文本，作为段落处理
          const text = node.textContent.trim();
          if (text.length > 50) {
            const p = document.createElement('p');
            p.textContent = text;
            content.appendChild(p);
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
  // 确保正确的字符编码
  ensureEncoding();
  
  const content = extractContent();
  
  if (!content) {
    console.error('无法提取文章内容');
    // 显示调试信息
    const debugInfo = document.createElement('div');
    debugInfo.innerHTML = `
      <h3>调试信息</h3>
      <p>无法提取文章内容，可能的原因：</p>
      <ul>
        <li>页面结构与预期不符</li>
        <li>文章尚未加载完成</li>
        <li>页面使用了动态加载</li>
      </ul>
      <p>请尝试等待页面完全加载后再点击纯净阅读按钮。</p>
    `;
    debugInfo.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      max-width: 500px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = `
      margin-top: 10px;
      padding: 5px 10px;
      background: #ff6600;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => document.body.removeChild(debugInfo);
    debugInfo.appendChild(closeBtn);
    document.body.appendChild(debugInfo);
    
    return false;
  }
  
  isPureMode = true;
  document.documentElement.classList.add(PURE_MODE_CLASS);
  
  // 完全清空body
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;';
  
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
  pureTitle.style.cssText = 'font-size: 32px; font-weight: 600; line-height: 1.3; color: #333; margin-bottom: 30px; text-align: left; word-wrap: break-word; overflow-wrap: break-word;';
  
  // 创建正文容器
  const pureBody = document.createElement('div');
  pureBody.className = 'pure-reading-body';
  pureBody.style.cssText = 'font-size: 18px; line-height: 1.8; color: #333; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;';
  
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
  toggleBtn.addEventListener('click', () => {
    // 尝试提取内容，如果失败则等待一段时间后重试
    const content = extractContent();
    if (!content) {
      // 显示加载提示
      toggleBtn.textContent = '加载中...';
      toggleBtn.disabled = true;
      
      // 等待2秒后重试
      setTimeout(() => {
        if (enterPureMode()) {
          // 成功进入纯净模式
        } else {
          // 失败，恢复按钮状态
          toggleBtn.textContent = '纯净阅读';
          toggleBtn.disabled = false;
        }
      }, 2000);
    } else {
      enterPureMode();
    }
  });
  
  document.body.appendChild(toggleBtn);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPureMode);
} else {
  initPureMode();
}

// 监听动态内容加载
let retryCount = 0;
const maxRetries = 5;
const retryInterval = 1000; // 1秒

function checkForContent() {
  const content = extractContent();
  if (content) {
    console.log('内容已加载，纯净阅读模式可用');
    return;
  }
  
  retryCount++;
  if (retryCount < maxRetries) {
    setTimeout(checkForContent, retryInterval);
  } else {
    console.log('达到最大重试次数，可能需要手动触发纯净阅读模式');
  }
}

// 延迟检查内容，确保动态加载的内容也能被捕获
setTimeout(checkForContent, 2000);
