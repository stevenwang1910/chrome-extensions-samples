async function getActiveApiConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiConfigs'], (result) => {
            const configs = result.apiConfigs || [];
            const activeConfig = configs.find(c => c.active);
            resolve(activeConfig || null);
        });
    });
}

async function callAiApi(config, content) {
    const { url, key, model } = config;
    
    const prompt = `请将以下新闻内容总结成100字以内的摘要，要求简洁明了，保留核心信息：\n\n${content}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的新闻摘要助手，擅长将新闻内容浓缩成简洁的摘要。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        throw new Error(`调用API失败: ${error.message}`);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
        handleSummarize(request.content)
            .then(summary => sendResponse({ success: true, summary }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function handleSummarize(content) {
    if (!content || content.trim().length === 0) {
        throw new Error('无法提取新闻内容');
    }

    const config = await getActiveApiConfig();
    if (!config) {
        throw new Error('请先在选项页面配置API');
    }

    const truncatedContent = content.substring(0, 8000);
    return await callAiApi(config, truncatedContent);
}
