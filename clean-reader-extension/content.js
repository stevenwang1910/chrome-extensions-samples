(function() {
  'use strict';

  const SELECTORS_TO_HIDE = [
    '.ntes_nav_wrap',
    '#js_N_NTES_wrap',
    '.post_area',
    '.ad_hover_href',
    '.top_ad_column',
    '.post_crumb',
    '.post_top',
    '.post_top_tie',
    '.post_top_share',
    '.post_comment',
    '#post_comment_area',
    '.tie-areas',
    '.post_recommends',
    '.post_next',
    '.post_statement',
    '.post_recommends_hot',
    '.post_recommends_ulist',
    '[adType]',
    '.common_ad_item',
    '.at_item',
    '#netease_search',
    '.to_reg',
    '.post_jubao',
    '.ntes-nav',
    '.hidden',
    '.post_side',
    '.post_aside',
    '.aside',
    '.sidebar',
    '.side_bar',
    '.post_guide',
    '.index_article',
    '.news_footer',
    '.footer',
    '#footer',
    '.post_footer',
    '.ep-source',
    '.ep-source a',
    '.ep-editor',
    '.post_share',
    '.post_share_to',
    '.gg',
    '.gg1',
    '.gg2',
    '.gg3',
    '.ad-wrapper',
    '.ad_wrapper',
    '.ad-bottom',
    '.ad-bottom-wrap',
    '.f_iframe',
    '#post_TJ',
    '.post_recommend_list',
    '.post_recommend_item',
    '.post_tuijian',
    '.news_ad',
    '.news_gg',
    '.topic-box',
    '.news_banner',
    '.content_banner',
    '.relative',
    '.news_quote',
    '.leftNav',
    '.right-nav',
    '.ne-footer',
    '.ne_b_l',
    '.ne_footer',
    '.ne_copyright',
    '.ntes_footer',
    '.post_fiexd_bottom',
    '.post_fixed_bottom',
    '.home-doc__news',
    '.keywords_wrap',
    '.keywords',
    '.post_keywords',
    '.post_tag',
    '.post_tags',
    '.source-sub',
    '.ep-time-soure',
    '.post_main_ad',
    '.lb广告位',
    '.lb_gg',
    '.lb_gg_ad',
    '.m-post-info',
    '.m-post-source',
    '.m-share',
    '.m-wiki-box',
    '.m-tie',
    '.m-hot-news',
    '.m-recommend',
    '.m-card',
    '.m-gg',
    '.m-ad',
    '.ggbox',
    '.gg-box',
    '.ad-box',
    '.adbox',
    '.sitemap',
    '.sitemap_wrapper',
    '#sitemap',
    '.index_mod_box',
    '.index_mod',
    '.index_list',
    '.index_list_box',
    '.news-list',
    '.news_list',
    '.post_news_list',
    '.related_news',
    '.related-news',
    '.rel_news',
    '.relative-news',
    '.news_related',
    '.news_relative',
    '.m-bottom-banner'
  ];

  const BODY_SELECTORS = [
    '.post_body',
    '.post_content',
    '.content',
    '#content',
    '.article-body',
    '.article_content',
    '.article-content',
    '.end-page'
  ];

  const TITLE_SELECTORS = [
    '.post_title',
    'h1',
    '.title',
    '.article-title',
    '.article_title',
    '.news_title',
    '.news-title'
  ];

  const INFO_SELECTORS = [
    '.post_info',
    '.info',
    '.article-info',
    '.article_info',
    '.source',
    '.ep-source',
    '.post_info_main',
    '.post_info_main_i'
  ];

  function findFirstElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function hideAllInterference() {
    SELECTORS_TO_HIDE.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.height = '0';
        el.style.width = '0';
        el.style.overflow = 'hidden';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.setAttribute('aria-hidden', 'true');
      });
    });

    const sideElements = document.querySelectorAll('.post_side, .aside, .ne_aside, .right, .sidebar');
    sideElements.forEach(el => {
      if (!el.querySelector('.post_body') && !el.querySelector('.post_content')) {
        el.remove();
      }
    });

    const scripts = document.querySelectorAll('script, style, iframe, ins');
    scripts.forEach(el => {
      const parent = el.parentElement;
      if (parent && (parent.classList.contains('post_body') || 
          parent.classList.contains('post_content') || 
          parent.id === 'content')) {
        el.remove();
      }
    });
  }

  function createCleanLayout() {
    const postBody = findFirstElement(BODY_SELECTORS);
    const postTitle = findFirstElement(TITLE_SELECTORS);
    const postInfo = findFirstElement(INFO_SELECTORS);

    if (!postBody && !postTitle) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'clean-reader-container';

    let hasContent = false;

    if (postTitle) {
      const titleClone = postTitle.cloneNode(true);
      titleClone.className = 'clean-reader-title';
      titleClone.style.display = 'block';
      titleClone.style.visibility = 'visible';
      container.appendChild(titleClone);
      hasContent = true;
    }

    if (postInfo) {
      const infoClone = postInfo.cloneNode(true);
      infoClone.className = 'clean-reader-info';
      infoClone.style.display = 'block';
      infoClone.style.visibility = 'visible';
      container.appendChild(infoClone);
      hasContent = true;
    }

    if (postBody) {
      const bodyClone = postBody.cloneNode(true);
      bodyClone.className = 'clean-reader-body';
      bodyClone.style.display = 'block';
      bodyClone.style.visibility = 'visible';
      
      const unwantedElements = bodyClone.querySelectorAll('.post_statement, .gg, .ad, script, style, iframe, ins');
      unwantedElements.forEach(el => el.remove());
      
      if (bodyClone.textContent.trim().length > 0) {
        container.appendChild(bodyClone);
        hasContent = true;
      }
    }

    if (!hasContent) {
      return;
    }

    const cleanWrapper = document.createElement('div');
    cleanWrapper.className = 'clean-reader-wrapper';
    cleanWrapper.appendChild(container);

    document.body.appendChild(cleanWrapper);

    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach(child => {
      if (child !== cleanWrapper && !child.classList.contains('clean-reader-wrapper')) {
        child.style.display = 'none';
        child.style.visibility = 'hidden';
      }
    });

    cleanWrapper.style.display = 'block';
    cleanWrapper.style.visibility = 'visible';
    container.style.display = 'block';
    container.style.visibility = 'visible';
  }

  function cleanBodyContent() {
    const bodyElements = document.querySelectorAll('.post_body p, .post_content p, #content p, .content p');
    bodyElements.forEach(p => {
      const text = p.textContent.trim();
      if (text.includes('特别声明') || text.includes('Notice:') || 
          text.includes('版权声明') || text.includes('本文来源') ||
          text.includes('责编：') || text.includes('责编:') ||
          text.includes('编辑：') || text.includes('编辑:') ||
          text.length < 5) {
        p.remove();
      }
    });

    const adElements = document.querySelectorAll('[class*="ad"], [id*="ad"], [class*="gg"], [id*="gg"]');
    adElements.forEach(el => {
      if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
        el.remove();
      }
    });
  }

  function applyReaderMode() {
    document.body.classList.add('clean-reader-mode');
    
    hideAllInterference();
    cleanBodyContent();
    createCleanLayout();

    const style = document.createElement('style');
    style.textContent = `
      body.clean-reader-mode {
        background: #fafafa !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: 100vh !important;
      }
      .clean-reader-wrapper {
        display: block !important;
        visibility: visible !important;
        max-width: 720px !important;
        margin: 0 auto !important;
        padding: 40px 20px !important;
        background: #fff !important;
        min-height: 100vh !important;
        position: relative !important;
        z-index: 99999 !important;
      }
      .clean-reader-container {
        display: block !important;
        visibility: visible !important;
      }
      .clean-reader-title {
        display: block !important;
        visibility: visible !important;
        font-size: 28px !important;
        font-weight: 700 !important;
        line-height: 1.4 !important;
        color: #1a1a1a !important;
        margin-bottom: 20px !important;
        text-align: left !important;
      }
      .clean-reader-title * {
        display: inline !important;
        visibility: visible !important;
      }
      .clean-reader-info {
        display: block !important;
        visibility: visible !important;
        font-size: 14px !important;
        color: #666 !important;
        margin-bottom: 30px !important;
        padding-bottom: 20px !important;
        border-bottom: 1px solid #eee !important;
      }
      .clean-reader-info * {
        display: inline !important;
        visibility: visible !important;
      }
      .clean-reader-body {
        display: block !important;
        visibility: visible !important;
        font-size: 17px !important;
        line-height: 1.8 !important;
        color: #333 !important;
      }
      .clean-reader-body * {
        display: revert !important;
        visibility: visible !important;
      }
      .clean-reader-body p {
        display: block !important;
        margin-bottom: 20px !important;
        text-align: justify !important;
      }
      .clean-reader-body strong {
        display: inline !important;
        font-weight: 600 !important;
        color: #1a1a1a !important;
      }
      .clean-reader-body img {
        display: block !important;
        max-width: 100% !important;
        height: auto !important;
        margin: 20px auto !important;
        border-radius: 4px !important;
      }
      .clean-reader-body a {
        display: inline !important;
        color: #1890ff !important;
        text-decoration: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function waitForContent() {
    const checkInterval = setInterval(() => {
      const postBody = findFirstElement(BODY_SELECTORS);
      const postTitle = findFirstElement(TITLE_SELECTORS);
      
      if (postBody && postBody.querySelector('p')) {
        clearInterval(checkInterval);
        applyReaderMode();
      } else if (postTitle) {
        clearInterval(checkInterval);
        setTimeout(() => {
          applyReaderMode();
        }, 1000);
      }
    }, 200);

    setTimeout(() => {
      clearInterval(checkInterval);
      applyReaderMode();
    }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForContent);
  } else {
    waitForContent();
  }
})();