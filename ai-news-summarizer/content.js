function extractArticleContent() {
    const postBody = document.querySelector('.post_body');
    if (!postBody) {
        return null;
    }

    const title = document.querySelector('h1.title')?.textContent || document.title;
    const paragraphs = Array.from(postBody.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(text => text && !text.startsWith('特别声明') && !text.includes('Notice:'));
    
    const content = paragraphs.join('\n');
    
    return {
        title,
        content
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getArticleContent') {
        const article = extractArticleContent();
        sendResponse({article});
    }
});

console.log('AI News Summarizer content script loaded');
