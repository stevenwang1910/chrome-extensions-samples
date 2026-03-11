const fs = require('fs');

// Read popup.js
const popupContent = fs.readFileSync('./popup.js', 'utf8');

// Check the executeScript call
console.log('=== Checking executeScript call ===');
const execPattern = /chrome\.scripting\.executeScript\(\{([\s\S]*?)\}\)/;
const match = popupContent.match(execPattern);
if (match) {
  console.log('executeScript call found:');
  console.log(match[0]);
}

// Check for world parameter
console.log('\n=== Checking for world parameter ===');
if (popupContent.includes('world:') || popupContent.includes("'MAIN'") || popupContent.includes('"MAIN"')) {
  console.log('Found world parameter');
} else {
  console.log('No world parameter found - using default (ISOLATED)');
}

// Let's check what happens when we try to simulate Chrome's serialization
console.log('\n=== Simulating Chrome serialization ===');
const funcMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);
if (funcMatch) {
  const funcStr = funcMatch[0];
  
  // Chrome's serialization is basically .toString()
  const func = eval(`(${funcStr})`);
  const serialized = func.toString();
  
  console.log('Function toString() starts with:', serialized.substring(0, 100));
  console.log('Function toString() ends with:', serialized.substring(serialized.length - 100));
  
  // Check if the serialized function is valid
  try {
    const reconstituted = eval(`(${serialized})`);
    console.log('✓ Serialized function can be reconstituted');
  } catch (e) {
    console.log('✗ Serialized function is invalid:', e.message);
  }
}

// Check URL pattern more carefully
console.log('\n=== URL Pattern Analysis ===');
const urlPatternMatch = popupContent.match(/githubIssuesUrlPattern\s*=\s*(\/[^/]+\/);/);
if (urlPatternMatch) {
  console.log('URL Pattern:', urlPatternMatch[1]);
  
  const pattern = eval(urlPatternMatch[1]);
  const testUrls = [
    'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
    'https://github.com/GoogleChrome/chrome-extensions-samples/issues/',
    'https://github.com/GoogleChrome/chrome-extensions-samples/issues?page=2',
    'https://github.com/GoogleChrome/chrome-extensions-samples/issues?q=is%3Aopen',
    'https://github.com/GoogleChrome/chrome-extensions-samples/issues/1482',
    'https://github.com/GoogleChrome/chrome-extensions-samples',
    'https://github.com/GoogleChrome/chrome-extensions-samples/pulls',
  ];
  
  testUrls.forEach(url => {
    console.log(`  ${pattern.test(url) ? '✓' : '✗'} ${url}`);
  });
}

// Check for potential async issues
console.log('\n=== Checking async patterns ===');
const awaitCount = (popupContent.match(/await /g) || []).length;
const asyncCount = (popupContent.match(/async /g) || []).length;
console.log(`async declarations: ${asyncCount}`);
console.log(`await expressions: ${awaitCount}`);

// Check error handling
console.log('\n=== Checking error handling ===');
const tryCount = (popupContent.match(/try \{/g) || []).length;
const catchCount = (popupContent.match(/catch \(/g) || []).length;
console.log(`try blocks: ${tryCount}`);
console.log(`catch blocks: ${catchCount}`);

// Check showError function
console.log('\n=== Checking showError function ===');
const showErrorMatch = popupContent.match(/function showError\([\s\S]*?\n\}/);
if (showErrorMatch) {
  console.log('showError function found');
  console.log(showErrorMatch[0]);
}

// Let's check if popup.html has all required elements
const popupHtml = fs.readFileSync('./popup.html', 'utf8');
const requiredIds = ['loading', 'content', 'issuesTable', 'debug', 'debugLog', 'issueCount'];
console.log('\n=== Checking required DOM elements ===');
requiredIds.forEach(id => {
  const found = popupHtml.includes(`id="${id}"`) || popupHtml.includes(`id='${id}'`);
  console.log(`  ${found ? '✓' : '✗'} #${id}`);
});

// Check if tbody exists
if (popupHtml.includes('<tbody>') || popupHtml.includes('<tbody/>')) {
  console.log('  ✓ tbody');
} else {
  console.log('  ✗ tbody');
}
