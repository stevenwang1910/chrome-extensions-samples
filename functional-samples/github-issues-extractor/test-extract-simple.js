const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the extractIssues function from popup.js
const popupContent = fs.readFileSync('popup.js', 'utf8');

// Extract the extractIssues function using a more robust method
const funcStart = popupContent.indexOf('function extractIssues()');
const funcEnd = popupContent.indexOf('return { issues, debugInfo };', funcStart) + 30;
let extractIssuesStr = popupContent.substring(funcStart, funcEnd);

// Make sure we have the complete function
while (!extractIssuesStr.endsWith('}')) {
  const nextBrace = popupContent.indexOf('}', funcEnd);
  if (nextBrace === -1) break;
  extractIssuesStr += popupContent.substring(funcEnd, nextBrace + 1);
  funcEnd = nextBrace + 1;
}

console.log('Function extracted, length:', extractIssuesStr.length);

// Read page.html
const html = fs.readFileSync('page.html', 'utf8');
const dom = new JSDOM(html, { 
  url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
  runScripts: 'dangerously'
});

// Create a context and run the function
const context = {
  document: dom.window.document,
  window: dom.window,
  console: console,
  issues: [],
  debugInfo: {}
};

// Execute the function in context
try {
  // Wrap and execute
  const script = new dom.window.Script();
  script.textContent = `
    window.extractIssues = ${extractIssuesStr}
  `;
  dom.window.document.head.appendChild(script);
  
  const result = dom.window.extractIssues();
  console.log('\n=== Results ===');
  console.log('Issues found:', result.issues.length);
  console.log('Debug info:', JSON.stringify(result.debugInfo, null, 2));
  
  if (result.issues.length > 0) {
    console.log('\nFirst 3 issues:');
    result.issues.slice(0, 3).forEach(issue => {
      console.log(`  ${issue.id}: ${issue.title.substring(0, 30)}... URL: ${issue.url}`);
    });
    
    // Check for null URLs
    const nullUrls = result.issues.filter(i => !i.url);
    console.log(`\nIssues with null URL: ${nullUrls.length} of ${result.issues.length}`);
  }
} catch (e) {
  console.log('Error:', e.message);
  console.log('Stack:', e.stack);
}
