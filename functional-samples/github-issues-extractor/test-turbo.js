// Test for Turbo Frame and Shadow DOM handling
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./page.html', 'utf8');

console.log('=== Analyzing GitHub Page Structure ===\n');

const dom = new JSDOM(html);
const doc = dom.window.document;

// Check for turbo-frame
console.log('1. Turbo Frame Analysis:');
const turboFrame = doc.querySelector('turbo-frame#repo-content-turbo-frame');
if (turboFrame) {
  console.log('   ✓ Found turbo-frame#repo-content-turbo-frame');
  console.log('   - turbo-frame content length:', turboFrame.innerHTML.length);
  
  // Check if react-app is inside turbo-frame
  const reactAppInTurbo = turboFrame.querySelector('react-app');
  console.log('   - react-app inside turbo-frame:', !!reactAppInTurbo);
  
  // Check what's inside turbo-frame
  const scriptsInTurbo = turboFrame.querySelectorAll('script[type="application/json"]');
  console.log('   - JSON scripts in turbo-frame:', scriptsInTurbo.length);
} else {
  console.log('   ✗ No turbo-frame found');
}

// Check document-level react-app
console.log('\n2. Document-level Elements:');
const reactApp = doc.querySelector('react-app');
console.log('   - react-app element:', !!reactApp);

const allScripts = doc.querySelectorAll('script[type="application/json"]');
console.log('   - Total JSON scripts:', allScripts.length);

// Check for data-testid patterns
console.log('\n3. DOM Selector Tests:');
const selectors = [
  '[data-testid="issue-row"]',
  '.issue-row',
  '.js-issue-row',
  '[id^="issue_"]',
  '.Box-row',
  'div[data-hovercard-type="issue"]'
];

selectors.forEach(sel => {
  const count = doc.querySelectorAll(sel).length;
  console.log(`   ${sel}: ${count} elements`);
});

// Look at the actual content structure
console.log('\n4. Searching for actual issue data:');

// Look for issues in any JSON script
allScripts.forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent);
    if (data.payload && data.payload.preloadedQueries) {
      console.log(`\n   Script ${i} has preloadedQueries:`);
      data.payload.preloadedQueries.forEach((q, j) => {
        console.log(`     Query ${j}: ${q.queryName}`);
        if (q.result?.data?.repository) {
          const repo = q.result.data.repository;
          if (repo.issues?.nodes) {
            console.log(`       - repo.issues.nodes: ${repo.issues.nodes.length}`);
          }
          if (repo.search?.edges) {
            console.log(`       - repo.search.edges: ${repo.search.edges.length}`);
          }
        }
      });
    }
  } catch (e) {
    // Not JSON or invalid
  }
});

// Now let's look at the extractIssues function and test it with simulated Chrome environment
console.log('\n5. Testing extractIssues with page context:');

// Extract the function from popup.js
const popupContent = fs.readFileSync('./popup.js', 'utf8');
const extractFuncMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);

if (extractFuncMatch) {
  const funcStr = extractFuncMatch[0];
  
  // Create a test environment that simulates Chrome's injected context
  const testEnv = `
    const document = (function() {
      const dom = new (require('jsdom').JSDOM)(html);
      return dom.window.document;
    })();
    const console = { 
      log: (...args) => console.log('  [page log]', ...args),
      error: (...args) => console.error('  [page error]', ...args)
    };
    
    ${funcStr}
    
    const result = extractIssues();
    console.log('  Issues found:', result.issues.length);
    console.log('  Debug info:', JSON.stringify(result.debugInfo, null, 2));
    result;
  `;
  
  try {
    const vm = new (require('vm2').VM)({
      sandbox: {
        require: require,
        html: html,
        console: console
      }
    });
    
    const result = vm.run(testEnv);
    console.log('\n   Final result:', result.issues.length, 'issues');
  } catch (e) {
    console.log('   Error:', e.message);
  }
}

// Check for possible data locations
console.log('\n6. Looking for alternative data locations:');

// Check for __INITIAL_STATE__ or similar
const initStateMatch = html.match(/window\.__([A-Z_]+)__\s*=/g);
if (initStateMatch) {
  console.log('   Found window globals:', initStateMatch);
}

// Check for any script with issue data
const issueRefs = html.match(/"number"\s*:\s*\d+,\s*"title"/g);
console.log('   Found issue-like patterns:', issueRefs ? issueRefs.length : 0);

// Check for GraphQL in script tags
const graphqlRefs = html.match(/query.*Issue.*Query/g);
console.log('   Found GraphQL query refs:', graphqlRefs ? [...new Set(graphqlRefs)] : 'none');

// Let me check if the data is in a different format
console.log('\n7. Checking react-app script content:');
const reactAppScript = doc.querySelector('react-app script[data-target="react-app.embeddedData"]');
if (reactAppScript) {
  try {
    const data = JSON.parse(reactAppScript.textContent);
    console.log('   Script has payload:', !!data.payload);
    console.log('   Script has props:', !!data.props);
    console.log('   Keys in payload:', Object.keys(data.payload || {}));
    
    if (data.payload.preloadedQueries) {
      console.log('   preloadedQueries count:', data.payload.preloadedQueries.length);
      data.payload.preloadedQueries.forEach((q, i) => {
        console.log(`     [${i}] ${q.queryName}:`, q.result ? 'has result' : 'no result');
        if (q.result?.data) {
          console.log('       data keys:', Object.keys(q.result.data));
        }
      });
    }
  } catch (e) {
    console.log('   Parse error:', e.message);
  }
}

// Now let's create a fix - the issue might be that the react-app is inside a shadow dom
// or the turbo frame needs to be accessed differently
console.log('\n8. Testing improved extraction logic:');

function improvedExtract() {
  const issues = [];
  const debug = {};
  
  // Method 1: Check turbo-frame first
  const turbo = document.querySelector('turbo-frame#repo-content-turbo-frame');
  const root = turbo || document;
  
  debug.hasTurbo = !!turbo;
  
  // Look for react-app in the right context
  const reactApp = root.querySelector('react-app');
  debug.hasReactApp = !!reactApp;
  
  if (reactApp) {
    const scripts = reactApp.querySelectorAll('script[type="application/json"]');
    debug.reactAppScripts = scripts.length;
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.payload?.preloadedQueries) {
          for (const q of data.payload.preloadedQueries) {
            if (q.result?.data?.repository) {
              const repo = q.result.data.repository;
              
              // Try different paths
              if (repo.issues?.nodes) {
                repo.issues.nodes.forEach(node => {
                  if (node.__typename === 'Issue') {
                    issues.push({
                      id: '#' + node.number,
                      status: node.state,
                      title: node.title,
                      author: node.author?.login,
                      date: node.createdAt?.split('T')[0]
                    });
                  }
                });
              }
              
              if (repo.search?.edges) {
                repo.search.edges.forEach(edge => {
                  const node = edge.node;
                  if (node?.__typename === 'Issue') {
                    issues.push({
                      id: '#' + node.number,
                      status: node.state,
                      title: node.title,
                      author: node.author?.login,
                      date: node.createdAt?.split('T')[0]
                    });
                  }
                });
              }
            }
          }
        }
      } catch (e) {}
    }
  }
  
  debug.found = issues.length;
  return { issues, debug };
}

// Test the improved logic
const testDom = new JSDOM(html);
global.document = testDom.window.document;
global.console = { log: () => {}, error: () => {} };

const improvedResult = eval(`(${improvedExtract.toString()})()`);
console.log('   Improved extraction found:', improvedResult.issues.length, 'issues');
console.log('   Debug:', improvedResult.debug);
