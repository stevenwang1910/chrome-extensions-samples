const fs = require('fs');
const { JSDOM } = require('jsdom');

// Create a simulated browser environment with page.html
const html = fs.readFileSync('page.html', 'utf8');
const dom = new JSDOM(html, { 
  url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues'
});

// Copy extractIssues function here for testing
function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  const debugInfo = {
    pageUrl: window.location.href,
    hasTurboFrame: !!document.querySelector('turbo-frame#repo-content-turbo-frame'),
    hasReactApp: !!document.querySelector('react-app'),
    hasReactPartial: !!document.querySelector('react-partial'),
    approach1: { found: false, count: 0, error: null },
    approach2: { found: false, count: 0, error: null },
    approach3: { found: false, count: 0, error: null },
    approach4: { found: false, count: 0, error: null }
  };
  
  try {
    // Approach 1: Extract from react-app embedded JSON (modern GitHub UI)
    try {
      debugInfo.approach1.found = true;
      
      // Try to find the turbo frame first
      const turboFrame = document.querySelector('turbo-frame#repo-content-turbo-frame');
      let container = turboFrame || document;
      
      // Look for react-app element and its embedded data
      const reactApp = container.querySelector('react-app');
      let reactAppScript = null;
      
      if (reactApp) {
        console.log('Found react-app element');
        // Check if react-app has shadow DOM
        if (reactApp.shadowRoot) {
          console.log('react-app has shadowRoot');
          reactAppScript = reactApp.shadowRoot.querySelector('script[data-target="react-app.embeddedData"]');
        }
        // Check light DOM
        if (!reactAppScript) {
          reactAppScript = reactApp.querySelector('script[data-target="react-app.embeddedData"]');
        }
      }
      
      // Also try direct query
      if (!reactAppScript) {
        reactAppScript = container.querySelector('script[data-target="react-app.embeddedData"]');
      }
      
      // Try react-partial elements
      if (!reactAppScript) {
        const reactPartial = container.querySelector('react-partial');
        if (reactPartial) {
          console.log('Found react-partial element');
          if (reactPartial.shadowRoot) {
            reactAppScript = reactPartial.shadowRoot.querySelector('script[data-target="react-app.embeddedData"]');
          }
          if (!reactAppScript) {
            reactAppScript = reactPartial.querySelector('script[data-target="react-app.embeddedData"]');
          }
        }
      }
      
      // Final fallback: search all script tags with embedded data pattern
      if (!reactAppScript) {
        const allScripts = container.querySelectorAll('script[type="application/json"]');
        console.log('Total JSON scripts found:', allScripts.length);
        for (const script of allScripts) {
          if (script.textContent.includes('IssueIndexPageQuery')) {
            reactAppScript = script;
            console.log('Found script with IssueIndexPageQuery');
            break;
          }
        }
      }
      
      if (reactAppScript) {
        console.log('Found embedded data script');
        const jsonData = JSON.parse(reactAppScript.textContent);
        
        if (jsonData.payload && jsonData.payload.preloadedQueries) {
          console.log('Found preloadedQueries:', jsonData.payload.preloadedQueries.length);
          for (const query of jsonData.payload.preloadedQueries) {
            console.log('Query name:', query.queryName);
            const repoUrl = query.result?.data?.repository?.url;
            
            if (query.queryName === 'IssueIndexPageQuery' && query.result && query.result.data) {
              const searchEdges = query.result.data.repository?.search?.edges || [];
              console.log('Found', searchEdges.length, 'issues in GraphQL data');
              
              searchEdges.forEach(edge => {
                const node = edge.node;
                if (node && node.__typename === 'Issue') {
                  issues.push({
                    id: '#' + node.number,
                    number: node.number,
                    status: node.state || 'Unknown',
                    title: node.title || 'No title',
                    author: node.author?.login || 'Unknown',
                    date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                    url: node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null)
                  });
                }
              });
            }
            // Also check for issues in repository.issues
            if (query.result?.data?.repository?.issues) {
              const issueNodes = query.result.data.repository.issues.nodes || [];
              console.log('Found issues in repository.issues:', issueNodes.length);
              issueNodes.forEach(node => {
                if (node && node.__typename === 'Issue') {
                  issues.push({
                    id: '#' + node.number,
                    number: node.number,
                    status: node.state || 'Unknown',
                    title: node.title || 'No title',
                    author: node.author?.login || 'Unknown',
                    date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                    url: node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null)
                  });
                }
              });
            }
          }
        }
        debugInfo.approach1.count = issues.length;
      } else {
        debugInfo.approach1.error = 'No embedded data script found';
      }
    } catch (e) {
      debugInfo.approach1.error = e.message;
      console.error('Approach 1 error:', e);
    }
    
    console.log('Found', issues.length, 'issues using react-app approach');
    
    // Approach 2: Check all script tags in the entire document
    if (issues.length === 0) {
      try {
        console.log('Trying all script tags in document...');
        const allScripts = document.querySelectorAll('script[type="application/json"]');
        console.log('Found', allScripts.length, 'JSON script tags');
        debugInfo.approach2.found = true;
        
        for (const script of allScripts) {
          try {
            const text = script.textContent;
            if (text.includes('Issue') && text.includes('nodes')) {
              const jsonData = JSON.parse(text);
              if (jsonData.payload && jsonData.payload.preloadedQueries) {
                for (const query of jsonData.payload.preloadedQueries) {
                  if (query.result && query.result.data) {
                    const repo = query.result.data.repository;
                    if (repo) {
                      const repoUrl = repo.url;
                      const searchEdges = repo.search?.edges || [];
                      const issueNodes = repo.issues?.nodes || [];
                      console.log('Script has search edges:', searchEdges.length, 'issue nodes:', issueNodes.length);
                      
                      [...searchEdges, ...issueNodes].forEach(item => {
                        const node = item.node || item;
                        if (node && node.__typename === 'Issue') {
                          issues.push({
                            id: '#' + node.number,
                            number: node.number,
                            status: node.state || 'Unknown',
                            title: node.title || 'No title',
                            author: node.author?.login || 'Unknown',
                            date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                            url: node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null)
                          });
                        }
                      });
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log('Error parsing script data:', e.message);
          }
        }
        // Remove duplicates
        const uniqueIssues = [];
        const seen = new Set();
        for (const issue of issues) {
          if (!seen.has(issue.id)) {
            seen.add(issue.id);
            uniqueIssues.push(issue);
          }
        }
        issues.length = 0;
        issues.push(...uniqueIssues);
        debugInfo.approach2.count = issues.length;
      } catch (e) {
        debugInfo.approach2.error = e.message;
        console.error('Approach 2 error:', e);
      }
    }
    
    // Approach 3: Try to find issues in the IssuesListPage query
    if (issues.length === 0) {
      try {
        console.log('Trying IssuesListPage query...');
        const allScripts = document.querySelectorAll('script[type="application/json"]');
        
        for (const script of allScripts) {
          try {
            const jsonData = JSON.parse(script.textContent);
            if (jsonData.payload && jsonData.payload.preloadedQueries) {
              for (const query of jsonData.payload.preloadedQueries) {
                console.log('Found query:', query.queryName);
                if (query.result?.data) {
                  const repo = query.result.data.repository;
                  if (repo && repo.issues) {
                    const repoUrl = repo.url;
                    const issueNodes = repo.issues.nodes || [];
                    console.log('Found issues in repo.issues:', issueNodes.length);
                    issueNodes.forEach(node => {
                      if (node && node.__typename === 'Issue') {
                        issues.push({
                          id: '#' + node.number,
                          number: node.number,
                          status: node.state || 'Unknown',
                          title: node.title || 'No title',
                          author: node.author?.login || 'Unknown',
                          date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                          url: node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null)
                        });
                      }
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.log('Error parsing script data:', e.message);
          }
        }
        debugInfo.approach3.count = issues.length;
      } catch (e) {
        debugInfo.approach3.error = e.message;
        console.error('Approach 3 error:', e);
      }
    }
    
    // Approach 4: DOM scraping - look for actual issue elements
    if (issues.length === 0) {
      try {
        console.log('Trying DOM scraping for issue rows...');
        debugInfo.approach4.found = true;
        
        // Try different selectors
        const selectors = [
          '[data-testid="issue-row"]',
          '.js-issue-row',
          '.issue-row',
          'div[id^="issue_"][data-hovercard-type="issue"]'
        ];
        
        let issueRows = [];
        for (const selector of selectors) {
          const rows = document.querySelectorAll(selector);
          if (rows.length > 0) {
            issueRows = rows;
            console.log('Found rows with selector:', selector, rows.length);
            break;
          }
        }
        
        // Also check inside turbo frame
        if (issueRows.length === 0) {
          const turboFrame = document.querySelector('turbo-frame#repo-content-turbo-frame');
          if (turboFrame) {
            for (const selector of selectors) {
              const rows = turboFrame.querySelectorAll(selector);
              if (rows.length > 0) {
                issueRows = rows;
                console.log('Found rows inside turbo frame with selector:', selector, rows.length);
                break;
              }
            }
          }
        }
        
        console.log('Total issue rows found:', issueRows.length);
        
        issueRows.forEach(row => {
          try {
            const link = row.querySelector('a[href*="/issues/"]');
            if (link) {
              const href = link.getAttribute('href') || '';
              const issueMatch = href.match(/\/issues\/(\d+)/);
              if (issueMatch) {
                const title = link.textContent.trim() || '';
                const id = '#' + issueMatch[1];
                
                const statusIcon = row.querySelector('[aria-label*="Open"], [aria-label*="Closed"], .octicon-issue-opened, .octicon-issue-closed');
                let status = 'Unknown';
                if (statusIcon) {
                  const ariaLabel = statusIcon.getAttribute('aria-label') || '';
                  const className = statusIcon.className || '';
                  if (ariaLabel.includes('Open') || className.includes('opened')) status = 'OPEN';
                  if (ariaLabel.includes('Closed') || className.includes('closed')) status = 'CLOSED';
                }
                
                const authorLink = row.querySelector('a[href^="/"][data-hovercard-type="user"]');
                let author = 'Unknown';
                if (authorLink) {
                  const href = authorLink.getAttribute('href') || '';
                  author = href.substring(1);
                }
                
                const time = row.querySelector('relative-time, time');
                let date = 'Unknown';
                if (time) {
                  const datetime = time.getAttribute('datetime') || time.getAttribute('title');
                  if (datetime) date = datetime.split('T')[0];
                }
                
                if (!issues.find(i => i.id === id)) {
                  const number = parseInt(issueMatch[1]);
                  const url = `https://github.com${href}`;
                  issues.push({ id, number, status, title, author, date, url });
                }
              }
            }
          } catch (e) {
            console.log('Error parsing row:', e);
          }
        });
        
        debugInfo.approach4.count = issues.length;
      } catch (e) {
        debugInfo.approach4.error = e.message;
        console.error('Approach 4 error:', e);
      }
    }
    
  } catch (error) {
    console.error('Error extracting issues:', error);
  }
  
  console.log('Returning issues:', issues.length, 'Debug:', debugInfo);
  return { issues, debugInfo };
}

// Set up the context
global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Run the test
console.log('Testing extractIssues function...\n');
const result = extractIssues();

console.log('\n=== FINAL RESULTS ===');
console.log('Total issues extracted:', result.issues.length);
console.log('Debug info:', JSON.stringify(result.debugInfo, null, 2));

if (result.issues.length > 0) {
  console.log('\n=== Sample Issues ===');
  result.issues.slice(0, 5).forEach(issue => {
    console.log(`\n${issue.id}`);
    console.log(`  Title: ${issue.title}`);
    console.log(`  URL: ${issue.url}`);
    console.log(`  Status: ${issue.status}`);
    console.log(`  Author: ${issue.author}`);
    console.log(`  Date: ${issue.date}`);
  });
  
  // Check for null URLs
  const nullUrls = result.issues.filter(i => !i.url);
  console.log(`\n=== URL Validation ===`);
  console.log(`Issues with null URL: ${nullUrls.length} of ${result.issues.length}`);
  
  if (nullUrls.length > 0) {
    console.log('Null URL issues:', nullUrls.map(i => i.id));
  } else {
    console.log('✓ All issues have valid URLs!');
  }
} else {
  console.log('\n✗ No issues extracted!');
}
