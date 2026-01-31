// 后台脚本，处理扩展的后台逻辑

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(function(details) {
    // 设置默认配置
    chrome.storage.sync.set({
        autoEnable: false,
        version: '1.0'
    }, function() {
        console.log('网易新闻纯净阅读模式扩展已安装');
    });
    
    // 如果是首次安装，打开欢迎页面
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
    }
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getSettings') {
        // 获取设置
        chrome.storage.sync.get(['autoEnable'], function(result) {
            sendResponse({
                autoEnable: result.autoEnable || false
            });
        });
        return true; // 保持消息通道开放
    }
});

// 处理标签页更新
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // 当页面加载完成时，检查是否需要自动启用阅读模式
    if (changeInfo.status === 'complete' && tab.url) {
        // 检查是否是网易新闻页面
        if (isNeteaseNewsPage(tab.url)) {
            // 获取自动启用设置
            chrome.storage.sync.get(['autoEnable'], function(result) {
                if (result.autoEnable) {
                    // 向内容脚本发送启用阅读模式的指令
                    chrome.tabs.sendMessage(tabId, { action: 'enableReadingMode' });
                }
            });
        }
    }
});

// 检查是否是网易新闻页面
function isNeteaseNewsPage(url) {
    if (!url) return false;
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        
        // 检查域名
        if (!hostname.includes('163.com')) return false;
        
        // 检查路径
        if (pathname.includes('/dy/article/') || 
            pathname.includes('/article/') || 
            pathname.includes('/news/')) {
            return true;
        }
        
        return false;
    } catch (e) {
        return false;
    }
}