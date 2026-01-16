let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

function extractContent() {
  const title = document.querySelector('h1.post_title')?.textContent.trim() || 
                document.querySelector('h1')?.textContent.trim();
  const postBody = document.querySelector('.post_body') || 
                   document.querySelector('.article-content') || 
                   document.querySelector('#articleContent');
  
  if (!title || !postBody) {
    return null;
  }
  
  const content = document.createElement('div');
  content.className = 'post_body';
  
  const childNodes = postBody.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        const textNode = document.createTextNode(node.textContent);
        content.appendChild(textNode);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName;
      const isAdNode = node.classList && (node.classList.contains('ad') || 
                                          node.classList.contains('advertisement') || 
                                          node.classList.contains('ad-wrap'));
      if (isAdNode) continue;
      
      if (['P', 'DIV', 'SPAN', 'BR', 'HR', 'STRONG', 'EM', 'B', 'I', 'U', 'A', 
           'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 
           'PRE', 'CODE', 'TABLE', 'TR', 'TD', 'TH', 'THEAD', 'TBODY', 'CAPTION',
           'IMG', 'FIGURE', 'FIGCAPTION'].includes(tagName)) {
        if (tagName === 'P') {
          const textContent = node.textContent.trim();
          if (textContent.includes('{') && textContent.includes('}') && 
              (textContent.includes('.') || textContent.includes('#') || 
               textContent.includes('var') || textContent.includes('function') ||
               textContent.includes('=') || textContent.includes(':'))) {
            continue;
          }
        }
        
        const clone = node.cloneNode(false);
        
        if (tagName === 'IMG') {
          const src = node.getAttribute('src') || node.getAttribute('data-src') || 
                      node.getAttribute('data-original') || node.getAttribute('data-srcset');
          if (src) {
            clone.setAttribute('src', src);
          }
          const alt = node.getAttribute('alt');
          if (alt) {
            clone.setAttribute('alt', alt);
          }
          const width = node.getAttribute('width');
          if (width) {
            clone.setAttribute('width', width);
          }
          const height = node.getAttribute('height');
          if (height) {
            clone.setAttribute('height', height);
          }
          clone.removeAttribute('style');
        } else if (tagName === 'A') {
          const href = node.getAttribute('href');
          if (href) {
            clone.setAttribute('href', href);
          }
          const target = node.getAttribute('target');
          if (target) {
            clone.setAttribute('target', target);
          }
          clone.removeAttribute('style');
        } else {
          clone.removeAttribute('style');
          clone.removeAttribute('class');
        }
        
        const nestedNodes = node.childNodes;
        for (let j = 0; j < nestedNodes.length; j++) {
          const nestedNode = nestedNodes[j];
          if (nestedNode.nodeType === Node.TEXT_NODE) {
            clone.appendChild(document.createTextNode(nestedNode.textContent));
          } else if (nestedNode.nodeType === Node.ELEMENT_NODE) {
            const nestedTagName = nestedNode.tagName;
            if (['STRONG', 'EM', 'B', 'I', 'U', 'A', 'SPAN', 'BR', 'CODE', 'SUB', 'SUP', 'IMG'].includes(nestedTagName)) {
              const nestedClone = nestedNode.cloneNode(false);
              if (nestedTagName === 'A') {
                const href = nestedNode.getAttribute('href');
                if (href) nestedClone.setAttribute('href', href);
              } else if (nestedTagName === 'IMG') {
                const src = nestedNode.getAttribute('src') || nestedNode.getAttribute('data-src') || 
                            nestedNode.getAttribute('data-original');
                if (src) nestedClone.setAttribute('src', src);
                const alt = nestedNode.getAttribute('alt');
                if (alt) nestedClone.setAttribute('alt', alt);
              }
              nestedClone.removeAttribute('style');
              const deepNodes = nestedNode.childNodes;
              for (let k = 0; k < deepNodes.length; k++) {
                if (deepNodes[k].nodeType === Node.TEXT_NODE) {
                  nestedClone.appendChild(document.createTextNode(deepNodes[k].textContent));
                } else if (deepNodes[k].nodeType === Node.ELEMENT_NODE) {
                  const deepClone = deepNodes[k].cloneNode(true);
                  deepClone.removeAttribute('style');
                  nestedClone.appendChild(deepClone);
                }
              }
              clone.appendChild(nestedClone);
            }
          }
        }
        
        content.appendChild(clone);
      } else if (tagName === 'FIGURE') {
        const figureClone = document.createElement('figure');
        figureClone.removeAttribute('style');
        
        const figureChildNodes = node.childNodes;
        for (let j = 0; j < figureChildNodes.length; j++) {
          const figureNode = figureChildNodes[j];
          if (figureNode.nodeType === Node.TEXT_NODE) {
            figureClone.appendChild(document.createTextNode(figureNode.textContent));
          } else if (figureNode.nodeType === Node.ELEMENT_NODE) {
            if (figureNode.tagName === 'IMG') {
              const imgClone = document.createElement('img');
              const src = figureNode.getAttribute('src') || figureNode.getAttribute('data-src');
              if (src) imgClone.setAttribute('src', src);
              const alt = figureNode.getAttribute('alt');
              if (alt) imgClone.setAttribute('alt', alt);
              figureClone.appendChild(imgClone);
            } else if (figureNode.tagName === 'FIGCAPTION') {
              const figCaptionClone = document.createElement('figcaption');
              figCaptionClone.textContent = figureNode.textContent;
              figureClone.appendChild(figCaptionClone);
            }
          }
        }
        
        content.appendChild(figureClone);
      }
    }
  }
  
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
  document.body.className = '';
  document.body.innerHTML = '';
  
  const pureContainer = document.createElement('div');
  pureContainer.id = 'pure-reading-container';
  
  const pureContent = document.createElement('div');
  pureContent.className = 'pure-reading-content';
  
  const pureTitle = document.createElement('h1');
  pureTitle.className = 'pure-reading-title';
  pureTitle.textContent = content.title;
  
  const pureBody = document.createElement('div');
  pureBody.className = 'pure-reading-body';
  
  pureBody.appendChild(content.content);
  pureContent.appendChild(pureTitle);
  pureContent.appendChild(pureBody);
  pureContainer.appendChild(pureContent);
  document.body.appendChild(pureContainer);
  
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
  toggleBtn.className = 'pure-mode-btn';
  toggleBtn.addEventListener('click', exitPureMode);
  
  document.body.appendChild(toggleBtn);
}

function initPureMode() {
  if (isPureMode) {
    return;
  }
  
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'pure-reading-toggle';
  toggleBtn.textContent = '纯净阅读';
  toggleBtn.className = 'pure-mode-btn floating';
  toggleBtn.addEventListener('click', enterPureMode);
  
  document.body.appendChild(toggleBtn);
}

function checkAutoMode() {
  chrome.storage.sync.get(['autoPureMode'], function(result) {
    if (result.autoPureMode) {
      setTimeout(function() {
        if (!isPureMode) {
          enterPureMode();
        }
      }, 1000);
    } else {
      initPureMode();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAutoMode);
} else {
  checkAutoMode();
}
