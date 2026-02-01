document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const configBtn = document.getElementById('configBtn');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');

    summarizeBtn.addEventListener('click', async () => {
        summarizeBtn.disabled = true;
        statusDiv.textContent = '正在提取新闻内容...';
        statusDiv.className = 'status';
        resultDiv.style.display = 'none';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
            
            if (!response.content || response.content.trim().length === 0) {
                throw new Error('无法提取到新闻内容，请确保当前页面是新闻文章');
            }

            statusDiv.textContent = '正在调用AI总结...';
            
            const summarizeResponse = await chrome.runtime.sendMessage({
                action: 'summarize',
                content: response.content
            });

            if (summarizeResponse.success) {
                statusDiv.textContent = '总结完成！';
                statusDiv.className = 'status success';
                resultDiv.textContent = summarizeResponse.summary;
                resultDiv.style.display = 'block';
            } else {
                throw new Error(summarizeResponse.error || '总结失败');
            }
        } catch (error) {
            statusDiv.textContent = error.message;
            statusDiv.className = 'status error';
        } finally {
            summarizeBtn.disabled = false;
        }
    });

    configBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
