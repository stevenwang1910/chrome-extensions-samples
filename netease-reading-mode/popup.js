document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const autoEnableToggle = document.getElementById('autoEnableToggle');
    const toggleReadingModeBtn = document.getElementById('toggleReadingMode');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const statusMessage = document.getElementById('statusMessage');
    
    // 初始化设置
    initSettings();
    
    // 添加事件监听器
    autoEnableToggle.addEventListener('click', toggleAutoEnable);
    toggleReadingModeBtn.addEventListener('click', toggleReadingMode);
    resetSettingsBtn.addEventListener('click', resetSettings);
    
    // 初始化设置
    function initSettings() {
        chrome.storage.sync.get(['autoEnable'], function(result) {
            if (result.autoEnable) {
                autoEnableToggle.classList.add('active');
            }
        });
        
        // 检查当前标签页是否是网易新闻页面
        checkCurrentTab();
    }
    
    // 检查当前标签页
    function checkCurrentTab() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            const url = currentTab.url;
            
            // 检查是否是网易新闻页面
            if (isNeteaseNewsPage(url)) {
                toggleReadingModeBtn.disabled = false;
                showStatus('当前页面支持纯净阅读模式', 'enabled');
                
                // 检查是否已启用阅读模式
                checkReadingModeStatus(currentTab.id);
            } else {
                toggleReadingModeBtn.disabled = true;
                showStatus('当前页面不支持纯净阅读模式', 'disabled');
            }
        });
    }
    
    // 检查是否是网易新闻页面
    function isNeteaseNewsPage(url) {
        if (!url) return false;
        
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        
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
        if (url.includes('article') || 
            url.includes('doc')) {
            return true;
        }
        
        return false;
    }
    
    // 检查阅读模式状态
    function checkReadingModeStatus(tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'getStatus' }, function(response) {
            if (response && response.isReadingModeEnabled) {
                toggleReadingModeBtn.textContent = '退出阅读模式';
                showStatus('阅读模式已启用', 'enabled');
            } else {
                toggleReadingModeBtn.textContent = '启用阅读模式';
                showStatus('阅读模式未启用', 'disabled');
            }
        });
    }
    
    // 切换自动启用设置
    function toggleAutoEnable() {
        autoEnableToggle.classList.toggle('active');
        const isEnabled = autoEnableToggle.classList.contains('active');
        
        chrome.storage.sync.set({ autoEnable: isEnabled }, function() {
            showStatus(isEnabled ? '已启用自动阅读模式' : '已禁用自动阅读模式', isEnabled ? 'enabled' : 'disabled');
        });
    }
    
    // 切换阅读模式
    function toggleReadingMode() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            
            chrome.tabs.sendMessage(currentTab.id, { action: 'toggleReadingMode' }, function(response) {
                if (response && response.success) {
                    checkReadingModeStatus(currentTab.id);
                } else {
                    showStatus('切换阅读模式失败，请刷新页面后重试', 'disabled');
                }
            });
        });
    }
    
    // 重置设置
    function resetSettings() {
        chrome.storage.sync.set({ autoEnable: false }, function() {
            autoEnableToggle.classList.remove('active');
            showStatus('设置已重置', 'enabled');
        });
    }
    
    // 显示状态消息
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status ' + type;
        
        // 3秒后清除状态消息
        setTimeout(function() {
            statusMessage.textContent = '';
            statusMessage.className = 'status';
        }, 3000);
    }
});