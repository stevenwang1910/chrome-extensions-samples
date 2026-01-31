(function() {
    'use strict';

    // 检查是否已启用阅读模式
    let isReadingModeEnabled = false;

    // 创建阅读模式切换按钮
    function createToggleButton() {
        const button = document.createElement('div');
        button.id = 'netease-reading-mode-toggle';
        button.innerHTML = '纯净阅读';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            background: #e74c3c;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('mouseenter', function() {
            this.style.background = '#c0392b';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.background = '#e74c3c';
        });
        
        button.addEventListener('click', toggleReadingMode);
        
        document.body.appendChild(button);
        return button;
    }

    // 切换阅读模式
    function toggleReadingMode() {
        isReadingModeEnabled = !isReadingModeEnabled;
        const button = document.getElementById('netease-reading-mode-toggle');
        
        if (isReadingModeEnabled) {
            enableReadingMode();
            button.innerHTML = '退出阅读';
            button.style.background = '#27ae60';
            button.addEventListener('mouseleave', function() {
                this.style.background = '#27ae60';
            });
        } else {
            disableReadingMode();
            button.innerHTML = '纯净阅读';
            button.style.background = '#e74c3c';
            button.addEventListener('mouseleave', function() {
                this.style.background = '#e74c3c';
            });
        }
    }

    // 启用阅读模式
    function enableReadingMode() {
        // 隐藏所有非必要元素
        hideNonEssentialElements();
        
        // 优化正文显示
        optimizeContentDisplay();
        
        // 添加阅读模式样式
        document.body.classList.add('netease-reading-mode');
    }

    // 禁用阅读模式
    function disableReadingMode() {
        // 恢复所有隐藏元素
        showAllElements();
        
        // 移除阅读模式样式
        document.body.classList.remove('netease-reading-mode');
    }

    // 隐藏非必要元素
    function hideNonEssentialElements() {
        // 需要隐藏的选择器列表
        const selectorsToHide = [
            // 导航栏
            '.ntes_nav_wrap',
            '.header',
            '.nav',
            '.navigation',
            '.nav_wrap',
            '.nav_main',
            
            // 侧边栏
            '.post_side',
            '.sidebar',
            '.side',
            '.aside',
            '.right_side',
            '.left_side',
            
            // 广告
            '.ad_module',
            '.ad',
            '.advertisement',
            '.gg300',
            '[data-adid]',
            '.right_ad_item',
            '.ad_box',
            '.ad_content',
            '.ad_container',
            
            // 推荐内容
            '.post_recommend',
            '.recommend',
            '.related',
            '.hot-news',
            '.related_news',
            '.hot_recommend',
            '.recommend_list',
            
            // 评论区
            '.comment',
            '.comments',
            '.post_comment',
            '.comment_area',
            '.comment_box',
            '.comment_section',
            
            // 分享按钮
            '.share',
            '.post_share',
            '.share_box',
            '.share_area',
            '.share_btn',
            
            // 页脚
            '.footer',
            '.post_footer',
            '.foot',
            '.bottom',
            
            // 其他干扰元素
            '.blank20',
            '.blank25',
            '.post_wemedia',
            '.post_source',
            '.post_time',
            '.post_tag',
            '.ep-source',
            '.ep-time',
            '.post_info',
            '.post_btm',
            '.post_extra',
            
            // 悬浮元素
            '.suspend',
            '.float',
            '.floating',
            '.fixed',
            '.sticky',
            '.suspension',
            '.float_layer',
            '.suspend_layer',
            
            // 跟帖图标和悬浮按钮
            '.post_comment_btn',
            '.comment_btn',
            '.comment_fixed',
            '.comment_float',
            '.comment_suspension',
            '.post_comment_fixed',
            '.netease_comment_btn',
            '.comment_float_btn',
            '.reply_btn',
            '.reply_float',
            
            // 通用悬浮元素
            '[style*="position: fixed"]',
            '[style*="position:fixed"]',
            '[style*="position: absolute"]',
            '[style*="position:absolute"]'
        ];

        // 隐藏匹配的元素
        selectorsToHide.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // 保留阅读模式按钮
                    if (element.id === 'netease-reading-mode-toggle') return;
                    
                    element.dataset.originalDisplay = element.style.display || '';
                    element.style.display = 'none';
                });
            } catch (e) {
                console.warn('选择器执行失败:', selector, e);
            }
        });
        
        // 特别处理悬浮跟帖图标
        hideFloatingCommentIcons();
    }
    
    // 专门处理悬浮跟帖图标
    function hideFloatingCommentIcons() {
        // 查找所有可能包含悬浮元素的容器
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const position = style.position;
            
            // 检查是否是悬浮元素
            if (position === 'fixed' || position === 'sticky') {
                // 检查是否包含跟帖相关文本或图标
                const text = element.textContent.toLowerCase();
                const classList = element.className.toLowerCase();
                
                if (text.includes('跟帖') || 
                    text.includes('评论') || 
                    text.includes('回复') ||
                    classList.includes('comment') ||
                    classList.includes('reply') ||
                    classList.includes('suspension') ||
                    classList.includes('float')) {
                    
                    // 保留阅读模式按钮
                    if (element.id === 'netease-reading-mode-toggle') return;
                    
                    element.dataset.originalDisplay = element.style.display || '';
                    element.style.display = 'none';
                }
            }
        });
    }

    // 恢复所有隐藏元素
    function showAllElements() {
        const hiddenElements = document.querySelectorAll('[data-original-display]');
        hiddenElements.forEach(element => {
            if (element.dataset.originalDisplay) {
                element.style.display = element.dataset.originalDisplay;
            } else {
                element.style.display = '';
            }
            delete element.dataset.originalDisplay;
        });
    }

    // 优化正文显示
    function optimizeContentDisplay() {
        // 查找并优化标题
        const titleSelectors = [
            '.post_title',
            '.article_title',
            '.title',
            '.post_title_main',
            '.article_main_title',
            'h1',
            '.headline',
            '.news_title',
            '.content_title',
            '.main_title'
        ];
        
        let titleElement = null;
        for (const selector of titleSelectors) {
            titleElement = document.querySelector(selector);
            if (titleElement) break;
        }
        
        if (titleElement) {
            titleElement.style.fontSize = '28px';
            titleElement.style.fontWeight = 'bold';
            titleElement.style.marginBottom = '20px';
            titleElement.style.lineHeight = '1.4';
            titleElement.style.color = '#333';
            titleElement.style.textAlign = 'center';
            titleElement.style.padding = '0 20px';
        }
        
        // 查找并优化正文内容
        const contentSelectors = [
            '.post_body',
            '.post_content',
            '#content',
            '.article_content',
            '.content',
            '.post_text',
            '.article_body',
            '.news_content',
            '.main_content',
            '.content_body',
            '.post_main',
            '.article_main',
            '.text_content'
        ];
        
        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement) break;
        }
        
        // 如果没有找到明确的内容区域，尝试查找包含大量文本的div
        if (!contentElement) {
            const allDivs = document.querySelectorAll('div');
            let maxTextLength = 0;
            let candidateElement = null;
            
            allDivs.forEach(div => {
                const textLength = div.textContent.trim().length;
                if (textLength > maxTextLength && textLength > 500) { // 假设正文至少有500字符
                    // 检查是否不是导航、广告或其他干扰元素
                    const classList = div.className.toLowerCase();
                    if (!classList.includes('nav') && 
                        !classList.includes('ad') && 
                        !classList.includes('comment') &&
                        !classList.includes('recommend') &&
                        !classList.includes('footer') &&
                        !classList.includes('header')) {
                        maxTextLength = textLength;
                        candidateElement = div;
                    }
                }
            });
            
            contentElement = candidateElement;
        }
        
        if (contentElement) {
            contentElement.style.maxWidth = '800px';
            contentElement.style.margin = '0 auto';
            contentElement.style.padding = '20px';
            contentElement.style.fontSize = '18px';
            contentElement.style.lineHeight = '1.8';
            contentElement.style.color = '#333';
            contentElement.style.backgroundColor = '#fff';
            contentElement.style.textAlign = 'justify';
            contentElement.style.zIndex = '10'; // 确保内容在悬浮元素之上
            
            // 优化段落
            const paragraphs = contentElement.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.marginBottom = '16px';
                p.style.textIndent = '2em';
                p.style.lineHeight = '1.8';
            });
            
            // 优化图片
            const images = contentElement.querySelectorAll('img');
            images.forEach(img => {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '20px auto';
            });
            
            // 确保内容区域在所有悬浮元素之上
            contentElement.style.position = 'relative';
            contentElement.style.zIndex = '1000';
        }
        
        // 添加一个半透明背景，确保内容可读性
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            position: relative;
            z-index: 100;
            background-color: rgba(255, 255, 255, 0.95);
            padding: 20px;
            margin: 20px auto;
            max-width: 800px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        // 如果找到了标题和内容，将它们包装起来
        if (titleElement && contentElement && titleElement.parentNode !== contentElement) {
            const parent = contentElement.parentNode;
            parent.insertBefore(contentWrapper, contentElement);
            contentWrapper.appendChild(titleElement);
            contentWrapper.appendChild(contentElement);
        }
    }

    // 初始化扩展
    function init() {
        // 检查是否是网易新闻文章页面
        if (!isNeteaseNewsPage()) return;
        
        // 创建切换按钮
        createToggleButton();
        
        // 检查是否需要自动启用阅读模式
        chrome.storage.sync.get(['autoEnable'], function(result) {
            if (result.autoEnable) {
                toggleReadingMode();
            }
        });
    }

    // 检查是否是网易新闻页面
    function isNeteaseNewsPage() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        // 检查域名
        if (!hostname.includes('163.com')) return false;
        
        // 检查路径 - 扩展匹配范围
        if (pathname.includes('/dy/article/') || 
            pathname.includes('/article/') || 
            pathname.includes('/news/') ||
            pathname.includes('/dy/article/') ||
            pathname.includes('/news/article/') ||
            pathname.includes('/dy/') ||
            (hostname.includes('news.163.com') && pathname.includes('/'))) {
            return true;
        }
        
        // 检查URL中是否包含文章标识
        if (window.location.search.includes('article') || 
            window.location.search.includes('doc')) {
            return true;
        }
        
        return false;
    }

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'toggleReadingMode') {
            toggleReadingMode();
            sendResponse({ success: true, isReadingModeEnabled: isReadingModeEnabled });
        } else if (request.action === 'enableReadingMode') {
            if (!isReadingModeEnabled) {
                toggleReadingMode();
            }
            sendResponse({ success: true, isReadingModeEnabled: isReadingModeEnabled });
        } else if (request.action === 'getStatus') {
            sendResponse({ isReadingModeEnabled: isReadingModeEnabled });
        }
        return true; // 保持消息通道开放
    });
    
    // 确保页面加载完成后重新初始化
    window.addEventListener('load', function() {
        // 延迟初始化，确保页面元素完全加载
        setTimeout(init, 1000);
    });
})();