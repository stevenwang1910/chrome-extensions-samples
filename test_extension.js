// 测试脚本 - 验证网易新闻纯净阅读模式扩展功能

// 模拟Chrome扩展API
if (typeof chrome === 'undefined') {
    global.chrome = {
        storage: {
            sync: {
                get: function(keys, callback) {
                    // 模拟返回默认值
                    const result = {};
                    if (keys.includes('autoEnable')) {
                        result.autoEnable = false;
                    }
                    callback(result);
                },
                set: function(items, callback) {
                    console.log('设置存储:', items);
                    if (callback) callback();
                }
            }
        },
        runtime: {
            onMessage: {
                addListener: function(callback) {
                    console.log('消息监听器已添加');
                }
            },
            sendMessage: function(message, callback) {
                console.log('发送消息:', message);
                if (callback) callback({ success: true });
            }
        },
        tabs: {
            query: function(query, callback) {
                // 模拟返回当前标签页
                callback([{
                    id: 1,
                    url: 'https://news.163.com/20/0101/01/12345678_12345678.html'
                }]);
            },
            sendMessage: function(tabId, message, callback) {
                console.log('向标签页发送消息:', tabId, message);
                if (callback) callback({ success: true });
            },
            onUpdated: {
                addListener: function(callback) {
                    console.log('标签页更新监听器已添加');
                }
            }
        }
    };
}

// 测试内容脚本
console.log('=== 测试内容脚本 ===');

// 模拟DOM环境
const mockDocument = {
    readyState: 'complete',
    addEventListener: function(event, callback) {
        console.log(`添加事件监听器: ${event}`);
        callback();
    },
    querySelector: function(selector) {
        console.log(`查找元素: ${selector}`);
        // 模拟返回元素
        return {
            style: { display: 'block' },
            dataset: {},
            classList: {
                add: function(cls) { console.log(`添加类: ${cls}`); },
                remove: function(cls) { console.log(`移除类: ${cls}`); },
                contains: function(cls) { return false; }
            }
        };
    },
    querySelectorAll: function(selector) {
        console.log(`查找所有元素: ${selector}`);
        // 模拟返回元素数组
        return [
            {
                style: { display: 'block' },
                dataset: {}
            }
        ];
    },
    createElement: function(tagName) {
        console.log(`创建元素: ${tagName}`);
        return {
            id: '',
            innerHTML: '',
            style: { cssText: '', display: 'block' },
            classList: {
                add: function(cls) { console.log(`添加类: ${cls}`); }
            },
            addEventListener: function(event, callback) {
                console.log(`添加事件监听器: ${event}`);
            }
        };
    },
    body: {
        appendChild: function(element) {
            console.log('添加元素到body');
        }
    }
};

// 替换全局document对象
global.document = mockDocument;

// 加载content.js
try {
    require('./content.js');
    console.log('✅ content.js 加载成功');
} catch (error) {
    console.error('❌ content.js 加载失败:', error.message);
}

// 测试popup脚本
console.log('\n=== 测试popup脚本 ===');

// 模拟DOM环境
const mockPopupDocument = {
    addEventListener: function(event, callback) {
        console.log(`添加事件监听器: ${event}`);
        callback();
    },
    getElementById: function(id) {
        console.log(`获取元素: ${id}`);
        return {
            addEventListener: function(event, callback) {
                console.log(`添加事件监听器: ${event} 到元素 ${id}`);
                if (event === 'click' && id === 'toggleReadingMode') {
                    // 模拟点击事件
                    setTimeout(callback, 100);
                }
            },
            classList: {
                add: function(cls) { console.log(`添加类: ${cls} 到元素 ${id}`); },
                remove: function(cls) { console.log(`移除类: ${cls} 从元素 ${id}`); },
                contains: function(cls) { return false; }
            },
            checked: false,
            innerHTML: ''
        };
    },
    querySelector: function(selector) {
        console.log(`查找元素: ${selector}`);
        return {
            innerHTML: '',
            style: { display: 'block' }
        };
    }
};

// 替换全局document对象
global.document = mockPopupDocument;

// 加载popup.js
try {
    require('./popup.js');
    console.log('✅ popup.js 加载成功');
} catch (error) {
    console.error('❌ popup.js 加载失败:', error.message);
}

// 测试background脚本
console.log('\n=== 测试background脚本 ===');

// 加载background.js
try {
    require('./background.js');
    console.log('✅ background.js 加载成功');
} catch (error) {
    console.error('❌ background.js 加载失败:', error.message);
}

console.log('\n=== 测试完成 ===');
console.log('所有核心文件加载测试完成！');