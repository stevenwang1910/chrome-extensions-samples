// AI新闻总结小助手 - 内容脚本
// 用于从新闻页面提取内容并发送给后台脚本

(function() {
  'use strict';

  // 提取新闻标题和内容
  function extractNewsContent() {
    let title = '';
    let content = '';

    // 网易新闻页面结构
    if (window.location.hostname.includes('163.com')) {
      // 尝试多种方式获取标题
      title = document.querySelector('h1')?.textContent?.trim() || 
              document.querySelector('.post_title')?.textContent?.trim() ||
              document.querySelector('title')?.textContent?.trim() || '';
      
      // 尝试多种方式获取正文内容
      const contentSelectors = [
        '.post_text',
        '.post_body',
        '.post_content',
        '.article-content',
        '.content',
        '#endText'
      ];
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent?.trim() || '';
          if (content.length > 100) break; // 如果内容足够长，就使用它
        }
      }
      
      // 如果还是没找到内容，尝试获取整个页面的主要内容
      if (!content || content.length < 100) {
        const mainContent = document.querySelector('main') || 
                           document.querySelector('.main') || 
                           document.querySelector('#main');
        if (mainContent) {
          content = mainContent.textContent?.trim() || '';
        }
      }
    } 
    // 可以在这里添加其他新闻网站的内容提取逻辑
    else if (window.location.hostname.includes('sina.com.cn')) {
      // 新浪新闻的内容提取逻辑
      title = document.querySelector('h1')?.textContent?.trim() || 
              document.querySelector('title')?.textContent?.trim() || '';
      
      const contentSelectors = [
        '.article-content',
        '.content',
        '#artibody',
        '.article-body'
      ];
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent?.trim() || '';
          if (content.length > 100) break;
        }
      }
    }
    // 通用内容提取（作为最后的备选方案）
    else {
      title = document.querySelector('h1')?.textContent?.trim() || 
              document.querySelector('title')?.textContent?.trim() || '';
      
      // 尝试获取主要内容区域
      const contentSelectors = [
        'main',
        '.main',
        '#main',
        '.content',
        '.article-content',
        '.post-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent?.trim() || '';
          if (content.length > 100) break;
        }
      }
    }

    // 清理内容：移除多余的空白字符和广告
    content = content
      .replace(/\s+/g, ' ')
      .replace(/广告|推广|赞助|相关阅读|点击查看更多/g, '')
      .trim();

    // 如果内容太长，截取前2000个字符
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...';
    }

    return { title, content };
  }

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractNewsContent') {
      const newsContent = extractNewsContent();
      sendResponse(newsContent);
    }
    return true; // 保持消息通道开放
  });

  // 页面加载完成后，可以预先提取内容
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const newsContent = extractNewsContent();
      // 存储到本地，以便popup使用
      chrome.storage.local.set({ newsContent });
    });
  } else {
    const newsContent = extractNewsContent();
    chrome.storage.local.set({ newsContent });
  }
})();