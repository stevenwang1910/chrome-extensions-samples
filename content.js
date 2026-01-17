chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractNewsContent') {
    const newsContent = extractNewsContent();
    sendResponse(newsContent);
  }
  return true;
});

function extractNewsContent() {
  const title = document.querySelector('h1.post_title')?.textContent.trim() ||
                document.querySelector('h1')?.textContent.trim() ||
                document.title;

  let content = '';

  const bodyDiv = document.querySelector('div.post_body');
  if (bodyDiv) {
    const paragraphs = bodyDiv.querySelectorAll('p');
    content = Array.from(paragraphs)
      .map(p => p.textContent.trim())
      .filter(p => p && p.length > 10)
      .join('\n');
  } else {
    const articleContent = document.querySelector('article') ||
                           document.querySelector('.article-content') ||
                           document.querySelector('#articleContent') ||
                           document.querySelector('.post_content');

    if (articleContent) {
      const paragraphs = articleContent.querySelectorAll('p');
      content = Array.from(paragraphs)
        .map(p => p.textContent.trim())
        .filter(p => p && p.length > 10)
        .join('\n');
    } else {
      const allParagraphs = document.querySelectorAll('p');
      content = Array.from(allParagraphs)
        .map(p => p.textContent.trim())
        .filter(p => p && p.length > 50)
        .slice(0, 20)
        .join('\n');
    }
  }

  return {
    title: title,
    content: content,
    hasContent: content.length > 100
  };
}
