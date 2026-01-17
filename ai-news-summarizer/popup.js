async function getArticleContent() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {action: 'getArticleContent'});
        return response.article;
    } catch (error) {
        console.error('Error getting article content:', error);
        return null;
    }
}

async function summarizeArticle(article) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'summarize',
            article
        });
        return response;
    } catch (error) {
        console.error('Error summarizing article:', error);
        return {success: false, error: error.message};
    }
}

async function handleSummarize() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const summaryDiv = document.getElementById('summary');
    
    summarizeBtn.disabled = true;
    summaryDiv.textContent = '正在生成摘要...';
    summaryDiv.className = 'summary-content loading';
    
    const article = await getArticleContent();
    
    if (!article) {
        summaryDiv.textContent = '无法找到文章内容，请检查是否在新闻页面。';
        summaryDiv.className = 'summary-content error';
        summarizeBtn.disabled = false;
        return;
    }
    
    document.getElementById('title').textContent = article.title;
    
    const result = await summarizeArticle(article);
    
    if (result.success) {
        summaryDiv.textContent = result.summary;
        summaryDiv.className = 'summary-content';
    } else {
        summaryDiv.textContent = `错误: ${result.error}`;
        summaryDiv.className = 'summary-content error';
    }
    
    summarizeBtn.disabled = false;
}

function handleCopy() {
    const summaryDiv = document.getElementById('summary');
    const summaryText = summaryDiv.textContent;
    
    if (summaryText === '点击"总结"按钮开始...' || 
        summaryText === '正在生成摘要...') {
        alert('没有摘要可复制');
        return;
    }
    
    navigator.clipboard.writeText(summaryText).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        copyBtn.disabled = true;
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('复制失败: ', err);
        alert('复制摘要失败');
    });
}

function handleSettings() {
    chrome.runtime.openOptionsPage();
}

document.getElementById('summarizeBtn').addEventListener('click', handleSummarize);
document.getElementById('copyBtn').addEventListener('click', handleCopy);
document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    handleSettings();
});

async function init() {
    const article = await getArticleContent();
    if (article) {
        document.getElementById('title').textContent = article.title;
    }
}

init();