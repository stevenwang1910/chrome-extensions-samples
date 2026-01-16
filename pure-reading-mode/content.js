let isPureReadingMode = false;
let originalStyles = new Map();
let originalBodyHTML = '';

function hideNonEssentialElements() {
    const title = document.querySelector('h1.post_title') || 
                  document.querySelector('h1.article-title') || 
                  document.querySelector('.post-title') ||
                  document.querySelector('h1.title') ||
                  document.querySelector('title') ||
                  document.querySelector('.article-title h1');
    
    const content = document.querySelector('div.post_body') || 
                    document.querySelector('div.article-content') || 
                    document.querySelector('div#articleContent') ||
                    document.querySelector('article') ||
                    document.querySelector('.article-body') ||
                    document.querySelector('#article-body');
    
    if (!title || !content) {
        console.log('无法识别标题或正文内容');
        return false;
    }
    
    const titleText = title.tagName === 'TITLE' ? title.textContent : title.innerText;
    const contentHTML = content.innerHTML;
    
    originalBodyHTML = document.body.innerHTML;
    
    const pureHTML = `
        <div class="pure-reading-container">
            <div class="pure-reading-header">
                <h1 class="pure-reading-title">${titleText}</h1>
                <button id="exitPureReading" class="pure-reading-exit">退出纯净阅读</button>
            </div>
            <div class="pure-reading-content">
                ${contentHTML}
            </div>
        </div>
    `;
    
    document.body.innerHTML = pureHTML;
    
    document.getElementById('exitPureReading').addEventListener('click', exitPureReading);
    
    return true;
}

function exitPureReading() {
    if (originalBodyHTML) {
        document.body.innerHTML = originalBodyHTML;
        originalBodyHTML = '';
        isPureReadingMode = false;
        
        const styleEl = document.getElementById('pure-reading-style');
        if (styleEl) {
            styleEl.remove();
        }
    }
}

function injectPureReadingStyles() {
    if (document.getElementById('pure-reading-style')) {
        return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'pure-reading-style';
    styleEl.textContent = `
        .pure-reading-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #ffffff;
            min-height: 100vh;
        }
        
        .pure-reading-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .pure-reading-title {
            font-size: 32px;
            font-weight: 700;
            color: #333;
            line-height: 1.4;
            margin: 0 0 20px 0;
        }
        
        .pure-reading-exit {
            padding: 8px 16px;
            background: #0078d4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .pure-reading-exit:hover {
            background: #005a9e;
        }
        
        .pure-reading-content {
            font-size: 18px;
            line-height: 1.8;
            color: #333;
        }
        
        .pure-reading-content p {
            margin-bottom: 20px;
        }
        
        .pure-reading-content img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
        }
        
        .pure-reading-content h2, .pure-reading-content h3, .pure-reading-content h4 {
            margin-top: 30px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .pure-reading-content h2 {
            font-size: 24px;
        }
        
        .pure-reading-content h3 {
            font-size: 20px;
        }
        
        .pure-reading-content strong {
            font-weight: 600;
        }
        
        .pure-reading-content a {
            color: #0078d4;
            text-decoration: none;
        }
        
        .pure-reading-content a:hover {
            text-decoration: underline;
        }
    `;
    
    document.head.appendChild(styleEl);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enablePureReading') {
        if (!isPureReadingMode) {
            injectPureReadingStyles();
            const success = hideNonEssentialElements();
            isPureReadingMode = success;
            sendResponse({ success: success });
        } else {
            sendResponse({ success: true, message: '已处于纯净阅读模式' });
        }
    } else if (request.action === 'disablePureReading') {
        if (isPureReadingMode) {
            exitPureReading();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, message: '未处于纯净阅读模式' });
        }
    } else if (request.action === 'checkStatus') {
        sendResponse({ isActive: isPureReadingMode });
    }
});