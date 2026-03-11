const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the popup.js content
const popupContent = fs.readFileSync('popup.js', 'utf8');

// Extract and test the extractIssues function serialization
// This simulates what Chrome does when passing functions to executeScript

console.log('=== Testing Chrome Extension Serialization ===\n');

// Step 1: Extract the extractIssues function from popup.js
const startIdx = popupContent.indexOf('function extractIssues()');
let braceCount = 0;
let endIdx = -1;
for (let i = startIdx; i < popupContent.length; i++) {
  if (popupContent[i] === '{') braceCount++;
  if (popupContent[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

const extractIssuesStr = popupContent.substring(startIdx, endIdx);
console.log('extractIssues function length:', extractIssuesStr.length);

// Step 2: Test if the function can be serialized like Chrome does
try {
  // Chrome serializes functions by calling toString()
  const func = eval('(' + extractIssuesStr + ')');
  const serialized = func.toString();
  console.log('✓ Function can be toString() serialized');
  
  // Verify that the serialized function is valid JS
  const deserialized = eval('(' + serialized + ')');
  console.log('✓ Serialized function can be deserialized');
  
  // Step 3: Test in actual page context
  const html = fs.readFileSync('page.html', 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
    runScripts: 'dangerously'
  });
  
  // Inject the function into the simulated page
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = `
    window.extractIssues = ${serialized};
  `;
  dom.window.document.head.appendChild(scriptEl);
  
  // Execute it in the page context
  const result = dom.window.eval('extractIssues()');
  console.log('✓ Function executes in page context');
  console.log('  Issues found:', result.issues.length);
  
  // Check URLs
  const nullUrls = result.issues.filter(i => !i.url);
  console.log('  Issues with null URL:', nullUrls.length);
  
  if (result.issues.length > 0) {
    console.log('\n=== Sample Results ===');
    result.issues.slice(0, 3).forEach(issue => {
      console.log(`  ${issue.id}: ${issue.url}`);
    });
  }
  
  // Check if debug info is correct
  console.log('\n=== Debug Info ===');
  console.log('  Approach 1 count:', result.debugInfo.approach1.count);
  console.log('  Approach 1 error:', result.debugInfo.approach1.error);
  
} catch (e) {
  console.log('✗ Error:', e.message);
  console.log(e.stack);
}

// Step 4: Check for Chrome specific issues
console.log('\n=== Chrome Extension Specific Checks ===');

// Check if the function uses any Chrome API that's not available in MAIN world
const chromeApiCalls = extractIssuesStr.match(/chrome\.\w+/g);
if (chromeApiCalls) {
  console.log('✗ Function uses Chrome API:', chromeApiCalls);
} else {
  console.log('✓ Function does not use Chrome API (safe for MAIN world)');
}

// Check for async operations in MAIN world
if (extractIssuesStr.includes('await') || extractIssuesStr.includes('async')) {
  console.log('⚠️  Function contains async/await - check if this is intended');
} else {
  console.log('✓ Function is synchronous (good for executeScript)');
}

// Check manifest configuration
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log('\n=== Manifest Configuration ===');
console.log('Manifest V3:', manifest.manifest_version === 3);
console.log('activeTab permission:', manifest.permissions.includes('activeTab'));
console.log('scripting permission:', manifest.permissions.includes('scripting'));
console.log('github host permission:', manifest.host_permissions?.includes('https://github.com/*'));

// Check popup HTML
const popupHtml = fs.readFileSync('popup.html', 'utf8');
console.log('\n=== Popup HTML Check ===');
console.log('Has popup.js script:', popupHtml.includes('popup.js'));
console.log('Has issuesTable:', popupHtml.includes('issuesTable'));
console.log('Has loading div:', popupHtml.includes('loading'));
console.log('Has content div:', popupHtml.includes('content'));

console.log('\n=== All Checks Complete ===');
