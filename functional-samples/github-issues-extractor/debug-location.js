// Debug where the actual data is located
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./page.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

console.log('=== Finding the Issue Data Location ===\n');

// Find all script tags and see which one contains the data
const allScripts = doc.querySelectorAll('script');
console.log(`Total scripts: ${allScripts.length}\n`);

allScripts.forEach((script, i) => {
  const type = script.getAttribute('type');
  const dataTarget = script.getAttribute('data-target');
  const parentTag = script.parentElement?.tagName;
  const parentId = script.parentElement?.id;
  
  // Check if it contains issue data
  const hasIssueData = script.textContent.includes('IssueIndexPageQuery') || 
                      script.textContent.includes('"number":') && script.textContent.includes('"title"');
  
  if (hasIssueData || type === 'application/json') {
    console.log(`Script ${i}:`);
    console.log(`  type: ${type}`);
    console.log(`  data-target: ${dataTarget}`);
    console.log(`  parent: ${parentTag}#${parentId || ''}`);
    console.log(`  hasIssueData: ${hasIssueData}`);
    console.log(`  content length: ${script.textContent.length}`);
    
    if (hasIssueData) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.payload?.preloadedQueries) {
          console.log('  Has preloadedQueries!');
          data.payload.preloadedQueries.forEach((q, j) => {
            console.log(`    Query[${j}]: ${q.queryName}`);
            if (q.result?.data?.repository?.search?.edges) {
              console.log(`      Issues: ${q.result.data.repository.search.edges.length}`);
            }
          });
        }
      } catch (e) {
        console.log(`  Parse error: ${e.message}`);
      }
    }
    console.log('');
  }
});

// Check the DOM hierarchy
console.log('=== DOM Hierarchy Check ===\n');
const turboFrame = doc.querySelector('turbo-frame#repo-content-turbo-frame');
if (turboFrame) {
  console.log('turbo-frame children:');
  for (let i = 0; i < turboFrame.children.length; i++) {
    const child = turboFrame.children[i];
    console.log(`  [${i}] ${child.tagName}${child.id ? '#' + child.id : ''} ${child.className}`);
  }
}

// Check if react-app is a custom element that might have shadow DOM
console.log('\n=== Checking react-app position ===');
const reactApp = doc.querySelector('react-app');
console.log('reactApp parent:', reactApp?.parentElement?.tagName);
console.log('reactApp next sibling:', reactApp?.nextSibling?.nodeName);

// Check the position relative to turbo-frame
const isInTurbo = turboFrame?.contains(reactApp);
console.log('reactApp inside turbo-frame:', isInTurbo);

// Now let's check the actual querySelector behavior
console.log('\n=== QuerySelector Tests ===');

// The query in the current code
const reactAppScript = doc.querySelector('react-app script[data-target="react-app.embeddedData"]');
console.log('Current selector result:', !!reactAppScript);

// Alternative queries
const queries = [
  'script[data-target="react-app.embeddedData"]',
  'react-app script',
  'script[type="application/json"]',
  'turbo-frame script[type="application/json"]',
  'body > script[type="application/json"]'
];

queries.forEach(q => {
  const count = doc.querySelectorAll(q).length;
  console.log(`  ${q}: ${count} elements`);
});

// Let's look at the actual structure around the react-app tag
console.log('\n=== HTML Structure Around react-app ===');
const reactAppPos = html.indexOf('<react-app');
if (reactAppPos > 0) {
  const context = html.substring(reactAppPos - 500, reactAppPos + 2000);
  console.log(context.replace(/\s+/g, ' ').substring(0, 1000));
}

// Find IssueIndexPageQuery location
const queryPos = html.indexOf('IssueIndexPageQuery');
console.log('\n=== IssueIndexPageQuery Location ===');
if (queryPos > 0) {
  let scriptStart = html.lastIndexOf('<script', queryPos);
  let scriptEnd = html.indexOf('</script>', queryPos) + 9;
  console.log('Script containing query:');
  const scriptTag = html.substring(scriptStart, scriptEnd);
  const scriptTypeMatch = scriptTag.match(/type="([^"]+)"/);
  const scriptDataTarget = scriptTag.match(/data-target="([^"]+)"/);
  console.log('  type:', scriptTypeMatch ? scriptTypeMatch[1] : 'none');
  console.log('  data-target:', scriptDataTarget ? scriptDataTarget[1] : 'none');
  
  // Find parent element
  let parentStart = scriptStart;
  for (let i = 0; i < 5; i++) {
    parentStart = html.lastIndexOf('<', parentStart - 1);
    if (parentStart > 0) {
      const tagMatch = html.substring(parentStart, parentStart + 50).match(/<([a-zA-Z0-9-]+)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const idMatch = html.substring(parentStart, parentStart + 200).match(/id="([^"]+)"/);
        console.log(`  ancestor[${i}]: <${tag}>${idMatch ? '#' + idMatch[1] : ''}`);
        if (tag === 'body' || tag === 'html') break;
      }
    }
  }
}

// Now let's check why the current code works in test.js but might fail in Chrome
console.log('\n=== Analyzing the extractIssues Function ===');

// The issue might be timing - when the script runs in Chrome, maybe the data isn't there yet?
// Or maybe there's a CORS issue?

// Let me check what script contains the data
const dataScript = Array.from(allScripts).find(s => 
  s.textContent.includes('IssueIndexPageQuery') && s.textContent.includes('search')
);

if (dataScript) {
  console.log('\nData script details:');
  console.log('  type:', dataScript.type);
  console.log('  data-target:', dataScript.getAttribute('data-target'));
  console.log('  parent:', dataScript.parentElement.tagName);
  
  // Check if this is inside react-app
  const inReactApp = dataScript.closest('react-app');
  console.log('  Inside react-app:', !!inReactApp);
  
  // Check if this is inside turbo-frame
  const inTurbo = dataScript.closest('turbo-frame');
  console.log('  Inside turbo-frame:', !!inTurbo);
}

// Let me check if there are multiple react-app embedded data scripts
const reactAppScripts = doc.querySelectorAll('react-app script[type="application/json"]');
console.log('\nScripts inside react-app:');
reactAppScripts.forEach((s, i) => {
  console.log(`  [${i}] data-target: ${s.getAttribute('data-target')}`);
  try {
    const data = JSON.parse(s.textContent);
    console.log(`      keys: ${Object.keys(data).join(', ')}`);
    if (data.payload) {
      console.log(`      payload keys: ${Object.keys(data.payload).join(', ')}`);
    }
  } catch (e) {
    console.log(`      parse error: ${e.message}`);
  }
});
