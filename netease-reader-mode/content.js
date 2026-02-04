(function() {
  'use strict';

  let isReaderMode = false;
  let originalStyles = new Map();
  let readerContainer = null;

  const SELECTORS = {
    title: [
      'h1.post_title',
      'h1.title',
      'h1.article-title',
      'h1.headline',
      '.post_title',
      '.article-title',
      'h1'
    ],
    content: [
      '.post_body',
      '.post-content',
      '.article-content',
      '.content',
      '#content',
      '.text',
      '.article_body'
    ],
    author: [
      '.post_info',
      '.post-info',
      '.article-info',
      '.author',
      '.source'
    ],
    hideElements: [
      '.ntes_nav_wrap',
      '.ntes-nav',
      '#js_N_NTES_wrap',
      '.post_area[data-adid]',
      '.common_ad_item',
      '.top_ad_column',
      '.post_columnad_top',
      '.post_recommends',
      '.post_recommend',
      '.post_comment',
      '.tie-areas',
      '#post_comment_area',
      '#tie',
      '.post_next',
      '.post_top',
      '.post_top_tie',
      '.post_top_share',
      '.post_crumb',
      '.to_reg',
      '#netease_search',
      '.post_statement',
      '.float_ad_flag',
      '[class*="ad_"]',
      '[class*="advertisement"]',
      '[id*="ad_"]',
      '.sidebar',
      '.side-bar',
      '.right-side',
      '.left-side',
      '.related-news',
      '.hot-news',
      '.recommend',
      '.qrcode-img',
      '.js_qrcode_wrap'
    ]
  };

  function findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function findAllElements(selectors) {
    const elements = [];
    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...found);
      } catch (e) {
        console.warn('Invalid selector:', selector);
      }
    }
    return elements;
  }

  function saveOriginalStyles() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.id || el.className) {
        const key = el.id || el.className;
        if (!originalStyles.has(key)) {
          originalStyles.set(key, {
            display: el.style.display,
            visibility: el.style.visibility,
            position: el.style.position,
            zIndex: el.style.zIndex
          });
        }
      }
    });
  }

  function createReaderContainer() {
    if (readerContainer) return readerContainer;

    readerContainer = document.createElement('div');
    readerContainer.id = 'netease-reader-container';
    readerContainer.className = 'netease-reader-container';

    const titleEl = findElement(SELECTORS.title);
    const contentEl = findElement(SELECTORS.content);
    const authorEl = findElement(SELECTORS.author);

    if (!titleEl || !contentEl) {
      console.warn('网易阅读模式：无法找到标题或正文内容');
      return null;
    }

    const readerHeader = document.createElement('div');
    readerHeader.className = 'reader-header';

    const readerTitle = document.createElement('h1');
    readerTitle.className = 'reader-title';
    readerTitle.textContent = titleEl.textContent.trim();
    readerHeader.appendChild(readerTitle);

    if (authorEl) {
      const readerMeta = document.createElement('div');
      readerMeta.className = 'reader-meta';

      const timeMatch = authorEl.textContent.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'reader-time';
        timeSpan.textContent = timeMatch[1];
        readerMeta.appendChild(timeSpan);
      }

      const sourceLink = authorEl.querySelector('a');
      if (sourceLink) {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'reader-source';
        sourceSpan.textContent = '来源: ' + sourceLink.textContent.trim();
        readerMeta.appendChild(sourceSpan);
      }

      readerHeader.appendChild(readerMeta);
    }

    const readerContent = document.createElement('div');
    readerContent.className = 'reader-content';

    // 克隆正文内容，保留所有元素（图片、视频等）
    const clonedContent = contentEl.cloneNode(true);
    
    // 移除广告和其他不需要的元素
    const unwantedSelectors = [
      '.post_top', '.post_top_tie', '.post_top_share',
      '.post_statement', '.ad_hover_href', '[class*="ad_"]',
      '[id*="ad_"]', '.common_ad_item', '.at_item'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = clonedContent.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // 提取所有内容元素（段落、图片、视频、标题等）
    const contentElements = clonedContent.querySelectorAll('p, img, video, figure, figcaption, h2, h3, h4, blockquote, ul, ol, li, table, tr, td, th, tbody, thead, .img-wrap, .video-wrap, [class*="img"], [class*="video"]');
    
    if (contentElements.length > 0) {
      contentElements.forEach(el => {
        // 跳过空段落
        if (el.tagName === 'P' && !el.textContent.trim() && !el.querySelector('img, video')) {
          return;
        }
        
        // 克隆元素以避免引用问题
        const clonedEl = el.cloneNode(true);
        
        // 处理图片：确保图片能够正常显示
        if (el.tagName === 'IMG' || el.querySelector('img')) {
          const imgs = clonedEl.tagName === 'IMG' ? [clonedEl] : clonedEl.querySelectorAll('img');
          imgs.forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            // 保留原始src
            if (img.getAttribute('data-src') && !img.src) {
              img.src = img.getAttribute('data-src');
            }
          });
        }
        
        // 处理视频
        if (el.tagName === 'VIDEO' || el.querySelector('video')) {
          const videos = clonedEl.tagName === 'VIDEO' ? [clonedEl] : clonedEl.querySelectorAll('video');
          videos.forEach(video => {
            video.style.maxWidth = '100%';
            video.controls = true;
          });
        }
        
        readerContent.appendChild(clonedEl);
      });
    } else {
      // 如果没有找到特定元素，直接复制清理后的内容
      readerContent.innerHTML = clonedContent.innerHTML;
    }

    readerContainer.appendChild(readerHeader);
    readerContainer.appendChild(readerContent);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'reader-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = '退出阅读模式';
    closeBtn.onclick = () => toggleReaderMode(false);
    readerContainer.appendChild(closeBtn);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'reader-toggle-btn';
    toggleBtn.innerHTML = 'Aa';
    toggleBtn.title = '切换字体大小';
    let fontSizeLevel = 1;
    const fontSizes = ['14px', '16px', '18px', '20px'];
    toggleBtn.onclick = () => {
      fontSizeLevel = (fontSizeLevel + 1) % fontSizes.length;
      readerContent.style.fontSize = fontSizes[fontSizeLevel];
    };
    readerContainer.appendChild(toggleBtn);

    return readerContainer;
  }

  function hideDistractions() {
    const elementsToHide = findAllElements(SELECTORS.hideElements);
    elementsToHide.forEach(el => {
      if (el && !el.closest('.post_main') && !el.closest('.post_content')) {
        el.style.display = 'none';
      }
    });

    const bodyChildren = document.body.children;
    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      if (child.id !== 'netease-reader-container' && 
          child.tagName !== 'SCRIPT' && 
          child.tagName !== 'STYLE' &&
          !child.classList.contains('netease-reader-container')) {
        const hasContent = child.querySelector('.post_main, .post_content, .post_body, h1.post_title');
        if (!hasContent) {
          child.style.display = 'none';
        }
      }
    }
  }

  function showAllElements() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.display = '';
      el.style.visibility = '';
    });

    if (readerContainer && readerContainer.parentNode) {
      readerContainer.parentNode.removeChild(readerContainer);
    }
    readerContainer = null;

    document.body.classList.remove('netease-reader-active');
  }

  function enableReaderMode() {
    if (isReaderMode) return;

    saveOriginalStyles();

    const container = createReaderContainer();
    if (!container) {
      console.error('网易阅读模式：无法创建阅读容器');
      return;
    }

    hideDistractions();

    const mainContent = document.querySelector('.post_main, .post_content, #content, .wrapper');
    if (mainContent) {
      mainContent.style.display = 'none';
    }

    document.body.appendChild(container);
    document.body.classList.add('netease-reader-active');

    isReaderMode = true;

    // 安全地发送消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ action: 'readerModeEnabled' }).catch(() => {});
      } catch (e) {
        // 忽略消息发送错误
      }
    }
  }

  function disableReaderMode() {
    if (!isReaderMode) return;

    showAllElements();

    const mainContent = document.querySelector('.post_main, .post_content, #content, .wrapper');
    if (mainContent) {
      mainContent.style.display = '';
    }

    isReaderMode = false;

    // 安全地发送消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ action: 'readerModeDisabled' }).catch(() => {});
      } catch (e) {
        // 忽略消息发送错误
      }
    }
  }

  function toggleReaderMode(enable) {
    if (enable === undefined) {
      enable = !isReaderMode;
    }

    if (enable) {
      enableReaderMode();
    } else {
      disableReaderMode();
    }

    // 安全地保存状态
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ readerModeEnabled: enable });
      } catch (e) {
        // 忽略存储错误
      }
    }
  }

  window.toggleNetEaseReaderMode = toggleReaderMode;

  document.addEventListener('toggle-reader-mode', (e) => {
    toggleReaderMode(e.detail.enable);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isReaderMode) {
      toggleReaderMode(false);
    }
  });

  // 安全地读取存储的状态
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      chrome.storage.local.get(['readerModeEnabled'], (result) => {
        if (chrome.runtime.lastError) {
          console.log('读取存储状态失败:', chrome.runtime.lastError);
          return;
        }
        if (result && result.readerModeEnabled) {
          setTimeout(() => toggleReaderMode(true), 1000);
        }
      });
    } catch (e) {
      console.log('存储API不可用');
    }
  }

  console.log('网易新闻纯净阅读模式已加载');
})();
