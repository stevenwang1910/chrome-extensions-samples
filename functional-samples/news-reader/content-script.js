let isPureMode = false;
const PURE_MODE_CLASS = 'pure-reading-mode';

// Tags that are allowed in pure reading mode
const ALLOWED_TAGS = ['P', 'IMG', 'FIGURE', 'VIDEO', 'AUDIO', 'IFRAME', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'BR', 'HR', 'STRONG', 'B', 'EM', 'I', 'A', 'SPAN', 'FIGCAPTION', 'SOURCE', 'TRACK', 'PICTURE'];

// Tags that should be skipped
const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'HEAD'];

function isCodeBlock(text) {
  // Check if text looks like code (CSS or JavaScript)
  const trimmed = text.trim();
  if (!trimmed.includes('{') || !trimmed.includes('}')) {
    return false;
  }
  // Check for CSS/JS patterns
  const codePatterns = [
    /[.#][a-zA-Z][^{]*\{[^}]*\}/,  // CSS selectors
    /var\s+\w+\s*=/,               // JS var declarations
    /function\s+\w*\s*\(/,         // JS functions
    /\w+:\s*[^;]+;/               // CSS properties
  ];
  return codePatterns.some(pattern => pattern.test(trimmed));
}

function getImageSrc(imgNode) {
  // Try different attributes for lazy-loaded images
  const src = imgNode.getAttribute('src');
  if (src && !src.startsWith('data:') && !src.includes('placeholder')) {
    return src;
  }

  // Check data-src attributes (common lazy loading pattern)
  const dataSrc = imgNode.getAttribute('data-src');
  if (dataSrc) {
    return dataSrc;
  }

  // Check data-original
  const dataOriginal = imgNode.getAttribute('data-original');
  if (dataOriginal) {
    return dataOriginal;
  }

  // Check other common lazy load attributes
  const lazyAttrs = ['data-lazy-src', 'data-original-src', 'data-echo', 'data-url'];
  for (const attr of lazyAttrs) {
    const value = imgNode.getAttribute(attr);
    if (value) {
      return value;
    }
  }

  // If src is a data URI, try to find a real URL in other attributes
  if (src && src.startsWith('data:')) {
    return null;
  }

  return src;
}

function extractVideoFromDiv(node) {
  // NetEase news often wraps videos in div containers
  // Look for video-related attributes or child elements

  // Check if this div contains a video player
  const videoElement = node.querySelector('video');
  if (videoElement) {
    return cloneElement(videoElement);
  }

  // Check for iframe (embedded video players)
  const iframeElement = node.querySelector('iframe');
  if (iframeElement) {
    return cloneElement(iframeElement);
  }

  // Check for video-related data attributes
  const videoUrl = node.getAttribute('data-video-url') ||
                   node.getAttribute('data-src') ||
                   node.getAttribute('data-video');

  if (videoUrl) {
    const video = document.createElement('video');
    video.setAttribute('src', videoUrl);
    video.setAttribute('controls', '');
    video.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 30px auto;';
    return video;
  }

  // Check for img with video poster
  const posterImg = node.querySelector('img');
  if (posterImg) {
    const src = getImageSrc(posterImg);
    if (src) {
      const img = document.createElement('img');
      img.setAttribute('src', src);
      const alt = posterImg.getAttribute('alt');
      if (alt) img.setAttribute('alt', alt);
      return img;
    }
  }

  return null;
}

function cloneElement(node) {
  const tagName = node.tagName;

  // Skip script/style tags
  if (SKIP_TAGS.includes(tagName)) {
    return null;
  }

  // Only process allowed tags
  if (!ALLOWED_TAGS.includes(tagName)) {
    return null;
  }

  // For paragraphs, check if it's code
  if (tagName === 'P' && isCodeBlock(node.textContent)) {
    return null;
  }

  // Handle DIV containers that might contain videos
  if (tagName === 'DIV') {
    // Check if this div is a video container
    const className = node.className || '';
    const hasVideoClass = className.includes('video') ||
                          className.includes('player') ||
                          className.includes('media');

    if (hasVideoClass || node.querySelector('video, iframe')) {
      const videoElement = extractVideoFromDiv(node);
      if (videoElement) {
        return videoElement;
      }
    }

    // For regular divs, process children recursively
    const clone = document.createElement('div');
    const childNodes = node.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childClone = cloneElement(childNode);
        if (childClone) {
          clone.appendChild(childClone);
        }
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        const textContent = childNode.textContent.trim();
        if (textContent) {
          clone.appendChild(document.createTextNode(childNode.textContent));
        }
      }
    }
    // Only return div if it has children
    return clone.childNodes.length > 0 ? clone : null;
  }

  const clone = document.createElement(tagName.toLowerCase());

  // Copy text content for text-based elements
  if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'FIGCAPTION', 'SPAN', 'STRONG', 'B', 'EM', 'I'].includes(tagName)) {
    clone.textContent = node.textContent;
  }

  // Copy specific attributes for media elements
  if (tagName === 'IMG') {
    const src = getImageSrc(node);
    const alt = node.getAttribute('alt');
    if (src) clone.setAttribute('src', src);
    if (alt) clone.setAttribute('alt', alt);
  }

  if (tagName === 'VIDEO') {
    const src = node.getAttribute('src');
    const poster = node.getAttribute('poster');
    const controls = node.hasAttribute('controls');
    const width = node.getAttribute('width');
    const height = node.getAttribute('height');
    const autoplay = node.hasAttribute('autoplay');
    const muted = node.hasAttribute('muted');

    if (src) clone.setAttribute('src', src);
    if (poster) clone.setAttribute('poster', poster);
    clone.setAttribute('controls', ''); // Always add controls for usability
    if (width) clone.setAttribute('width', width);
    if (height) clone.setAttribute('height', height);
    if (autoplay) clone.setAttribute('autoplay', '');
    if (muted) clone.setAttribute('muted', '');

    // Copy source elements
    const sources = node.querySelectorAll('source');
    for (const source of sources) {
      const sourceClone = cloneElement(source);
      if (sourceClone) {
        clone.appendChild(sourceClone);
      }
    }
  }

  if (tagName === 'AUDIO') {
    const src = node.getAttribute('src');
    const controls = node.hasAttribute('controls');
    if (src) clone.setAttribute('src', src);
    if (controls) clone.setAttribute('controls', '');
  }

  if (tagName === 'IFRAME') {
    const src = node.getAttribute('src');
    const width = node.getAttribute('width');
    const height = node.getAttribute('height');
    const allowFullscreen = node.hasAttribute('allowfullscreen');
    if (src) clone.setAttribute('src', src);
    if (width) clone.setAttribute('width', width);
    if (height) clone.setAttribute('height', height);
    if (allowFullscreen) clone.setAttribute('allowfullscreen', '');
  }

  if (tagName === 'A') {
    const href = node.getAttribute('href');
    if (href) {
      clone.setAttribute('href', href);
      clone.setAttribute('target', '_blank');
      clone.setAttribute('rel', 'noopener noreferrer');
    }
    clone.textContent = node.textContent;
  }

  if (tagName === 'SOURCE') {
    const src = node.getAttribute('src');
    const type = node.getAttribute('type');
    if (src) clone.setAttribute('src', src);
    if (type) clone.setAttribute('type', type);
  }

  // Handle PICTURE element for responsive images
  if (tagName === 'PICTURE') {
    const img = node.querySelector('img');
    if (img) {
      const src = getImageSrc(img);
      const alt = img.getAttribute('alt');
      if (src) {
        const imgClone = document.createElement('img');
        imgClone.setAttribute('src', src);
        if (alt) imgClone.setAttribute('alt', alt);
        return imgClone;
      }
    }
    return null;
  }

  // Recursively process child nodes for container elements
  if (['FIGURE', 'UL', 'OL', 'BLOCKQUOTE', 'SPAN', 'A', 'STRONG', 'B', 'EM', 'I'].includes(tagName)) {
    const childNodes = node.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childClone = cloneElement(childNode);
        if (childClone) {
          clone.appendChild(childClone);
        }
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        // Preserve text nodes within containers
        const textContent = childNode.textContent.trim();
        if (textContent) {
          clone.appendChild(document.createTextNode(childNode.textContent));
        }
      }
    }
  }

  return clone;
}

function extractContent() {
  // Adapt to NetEase news page structure
  const title = document.querySelector('h1.post_title')?.textContent.trim();
  const postBody = document.querySelector('.post_body');

  if (!title || !postBody) {
    return null;
  }

  // Create new content container
  const content = document.createElement('div');
  content.className = 'post_body';

  // Iterate through all child nodes of postBody
  const childNodes = postBody.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    // Only keep element nodes
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const cloned = cloneElement(node);
    if (cloned) {
      content.appendChild(cloned);
    }
  }

  // If no content extracted, try to get text directly
  if (content.children.length === 0) {
    const text = postBody.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      content.appendChild(p);
    } else {
      return null;
    }
  }

  return { title, content };
}

function enterPureMode() {
  const content = extractContent();

  if (!content) {
    return false;
  }

  isPureMode = true;
  document.documentElement.classList.add(PURE_MODE_CLASS);

  // Clear body completely
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Helvetica Neue\', Helvetica, Arial, sans-serif;';

  // Create pure reading container
  const pureContainer = document.createElement('div');
  pureContainer.id = 'pure-reading-container';
  pureContainer.style.cssText = 'width: 100%; min-height: 100vh; padding: 40px 20px; box-sizing: border-box;';

  // Create content container
  const pureContent = document.createElement('div');
  pureContent.className = 'pure-reading-content';
  pureContent.style.cssText = 'max-width: 800px; margin: 0 auto; background: white; padding: 60px 80px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border-radius: 8px;';

  // Create title
  const pureTitle = document.createElement('h1');
  pureTitle.className = 'pure-reading-title';
  pureTitle.textContent = content.title;
  pureTitle.style.cssText = 'font-size: 32px; font-weight: 600; line-height: 1.3; color: #333; margin-bottom: 30px; text-align: left;';

  // Create body container
  const pureBody = document.createElement('div');
  pureBody.className = 'pure-reading-body';
  pureBody.style.cssText = 'font-size: 18px; line-height: 1.8; color: #333;';

  // Add content
  pureBody.appendChild(content.content);
  pureContent.appendChild(pureTitle);
  pureContent.appendChild(pureBody);
  pureContainer.appendChild(pureContent);
  document.body.appendChild(pureContainer);

  // Add toggle button
  addToggleButton();

  return true;
}

function exitPureMode() {
  isPureMode = false;
  document.documentElement.classList.remove(PURE_MODE_CLASS);
  window.location.reload();
}

function addToggleButton() {
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'pure-reading-toggle';
  toggleBtn.textContent = 'Exit Pure Mode';
  toggleBtn.addEventListener('click', exitPureMode);

  document.body.appendChild(toggleBtn);
}

function initPureMode() {
  // Check if need to auto-enter pure mode
  if (isPureMode) {
    return;
  }

  // Add toggle button to page
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'pure-reading-toggle';
  toggleBtn.textContent = 'Pure Reading';
  toggleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 20px;
    background: #ff6600;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  toggleBtn.addEventListener('click', enterPureMode);

  document.body.appendChild(toggleBtn);
}

// Initialize after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPureMode);
} else {
  initPureMode();
}
