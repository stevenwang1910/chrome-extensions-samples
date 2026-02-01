function extractNewsContent() {
    const selectors = [
        '.post_body',
        '#content .post_body',
        '.post_content',
        'article',
        '.article-content',
        '.news-content',
        '.content',
        '#endText',
        '.text'
    ];

    let content = '';
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const paragraphs = element.querySelectorAll('p');
            if (paragraphs.length > 0) {
                content = Array.from(paragraphs)
                    .map(p => p.textContent.trim())
                    .filter(text => text.length > 0)
                    .join('\n');
                break;
            }
        }
    }

    if (!content) {
        const paragraphs = document.querySelectorAll('p');
        content = Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(text => text.length > 20)
            .join('\n');
    }

    return content;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const content = extractNewsContent();
        sendResponse({ content: content });
    }
    return true;
});
