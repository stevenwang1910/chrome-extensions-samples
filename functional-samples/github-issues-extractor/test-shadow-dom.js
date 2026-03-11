const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read page.html
const pageContent = fs.readFileSync('./page.html', 'utf8');

// Create DOM
const dom = new JSDOM(pageContent, { runScripts: 'dangerously' });
const document = dom.window.document;

console.log('=== Checking for Custom Elements and Shadow DOM ===\n');

// Check for custom elements
const customElements = ['react-app', 'react-partial', 'turbo-frame', 'issue-viewer'];
customElements.forEach(tag => {
  const elements = document.querySelectorAll(tag);
  console.log(`${tag}: ${elements.length} elements`);
  elements.forEach((el, i) => {
    console.log(`  [${i}] shadowRoot: ${el.shadowRoot ? 'exists' : 'null'}`);
    console.log(`      has children: ${el.children.length > 0}`);
  });
});

// Check if react-app has shadow root
const reactApp = document.querySelector('react-app');
if (reactApp) {
  console.log('\n=== react-app details ===');
  console.log('react-app.tagName:', reactApp.tagName);
  console.log('reactApp.shadowRoot:', reactApp.shadowRoot);
  console.log('reactApp.innerHTML length:', reactApp.innerHTML.length);
  console.log('reactApp.children.length:', reactApp.children.length);
  
  // Check what's inside react-app
  for (let i = 0; i < Math.min(reactApp.children.length, 10); i++) {
    const child = reactApp.children[i];
    console.log(`  child[${i}]: ${child.tagName} ${child.className || ''}`);
  }
  
  // Check for scripts inside react-app
  const scriptsInside = reactApp.querySelectorAll('script');
  console.log(`scripts inside react-app: ${scriptsInside.length}`);
  scriptsInside.forEach((s, i) => {
    if (s.type === 'application/json') {
      console.log(`  script[${i}]: type=${s.type}, data-target=${s.dataset.target || 'null'}`);
      console.log(`    content length: ${s.textContent.length}`);
    }
  });
}

// Now let's check what querySelector can see from document level
console.log('\n=== Document-level querySelector tests ===');

// Can we see inside react-app?
const scriptFromDoc = document.querySelector('react-app script[data-target="react-app.embeddedData"]');
console.log('document.querySelector("react-app script[data-target=...]"):', scriptFromDoc ? 'found' : 'not found');

// What about from within react-app?
if (reactApp) {
  const scriptFromReactApp = reactApp.querySelector('script[data-target="react-app.embeddedData"]');
  console.log('reactApp.querySelector("script[data-target=...]"):', scriptFromReactApp ? 'found' : 'not found');
}

// Check turbo-frame
const turboFrame = document.querySelector('turbo-frame');
if (turboFrame) {
  console.log('\n=== turbo-frame details ===');
  const scriptFromFrame = turboFrame.querySelector('script[data-target="react-app.embeddedData"]');
  console.log('turboFrame.querySelector(...):', scriptFromFrame ? 'found' : 'not found');
}

// Now let's test the actual extractIssues function's selectors
console.log('\n=== Testing extractIssues selectors ===');

// Approach 1 selector
const selector1 = 'react-app script[data-target="react-app.embeddedData"]';
const result1 = document.querySelector(selector1);
console.log(`Selector 1 (${selector1}):`, result1 ? 'found' : 'not found');

// Approach 2 selector
const selector2 = 'script[type="application/json"]';
const results2 = document.querySelectorAll(selector2);
console.log(`Selector 2 (${selector2}):`, results2.length, 'elements');

// Check all script tags with application/json
console.log('\n=== All application/json scripts ===');
const allScripts = document.querySelectorAll('script[type="application/json"]');
allScripts.forEach((script, i) => {
  const dataTarget = script.dataset.target || 'null';
  const parent = script.parentElement ? script.parentElement.tagName : 'null';
  console.log(`Script ${i}: data-target=${dataTarget}, parent=${parent}`);
  
  // Try to parse and see if it has issue data
  try {
    const data = JSON.parse(script.textContent);
    if (data.payload?.preloadedQueries) {
      console.log(`  Has preloadedQueries: ${data.payload.preloadedQueries.length}`);
      data.payload.preloadedQueries.forEach((q, j) => {
        console.log(`    Query[${j}]: ${q.queryName}`);
        if (q.result?.data?.repository?.search?.edges) {
          console.log(`      Issues: ${q.result.data.repository.search.edges.length}`);
        }
      });
    }
  } catch (e) {}
});

// Now let's create a modified extractIssues function that might work better
console.log('\n=== Testing enhanced selectors ===');

// Try to find the data in different ways
const findByText = (text) => {
  const scripts = document.querySelectorAll('script[type="application/json"]');
  for (const script of scripts) {
    if (script.textContent.includes(text)) {
      return script;
    }
  }
  return null;
};

const issueScript = findByText('IssueIndexPageQuery');
console.log('Found IssueIndexPageQuery by text search:', issueScript ? 'yes' : 'no');
if (issueScript) {
  console.log('  Parent:', issueScript.parentElement.tagName);
  console.log('  data-target:', issueScript.dataset.target);
  
  try {
    const data = JSON.parse(issueScript.textContent);
    if (data.payload?.preloadedQueries) {
      const query = data.payload.preloadedQueries.find(q => q.queryName === 'IssueIndexPageQuery');
      if (query) {
        console.log('  Has issues:', query.result?.data?.repository?.search?.edges?.length || 0);
      }
    }
  } catch (e) {}
}
