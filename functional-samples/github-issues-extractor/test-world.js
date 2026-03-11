const fs = require('fs');

// Read popup.js and check for potential issues
const popupContent = fs.readFileSync('./popup.js', 'utf8');

console.log('=== Analyzing Chrome Extension Injection Issues ===\n');

// Check for world parameter
console.log('1. Checking world parameter usage:');
if (popupContent.includes('world:')) {
  console.log('   ✓ world parameter is specified');
  const worldMatch = popupContent.match(/world:\s*['"]?(\w+)['"]?/);
  if (worldMatch) {
    console.log(`   World: ${worldMatch[1]}`);
  }
} else {
  console.log('   ✗ No world parameter - defaults to ISOLATED');
  console.log('   This might be an issue if the page uses Shadow DOM or custom elements');
}

// Check what world we should be using
console.log('\n2. Recommended approach for GitHub:');
console.log('   GitHub uses custom elements like <react-app> and <turbo-frame>');
console.log('   In ISOLATED world (default), querySelector might not work the same way');
console.log('   Consider using world: "MAIN" or adding allFrames: true');

// Check for allFrames
console.log('\n3. Checking allFrames parameter:');
if (popupContent.includes('allFrames:')) {
  console.log('   ✓ allFrames parameter is specified');
} else {
  console.log('   ✗ No allFrames parameter - defaults to false');
}

// Let's create a fixed version of the executeScript call
console.log('\n4. Current executeScript call:');
const currentCall = popupContent.match(/chrome\.scripting\.executeScript\(\{[\s\S]*?\}\)/);
if (currentCall) {
  console.log('   ' + currentCall[0].replace(/\s+/g, ' '));
}

console.log('\n5. Suggested fix:');
console.log(`
   chrome.scripting.executeScript({
     target: {tabId: tab.id},
     func: extractIssues,
     world: 'MAIN'  // Add this to access the page's actual DOM
   })
`);

// Also check for another common issue - Chrome 110+ changes
console.log('\n6. Chrome version considerations:');
console.log('   Chrome 110+ changed how ISOLATED world interacts with custom elements');
console.log('   Using world: "MAIN" is more reliable for GitHub pages');

// Let's also check if the function uses any DOM APIs that might be affected
console.log('\n7. Checking DOM API usage in extractIssues:');
const funcMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);
if (funcMatch) {
  const funcStr = funcMatch[0];
  const apis = ['querySelector', 'querySelectorAll', 'document', 'window'];
  apis.forEach(api => {
    const count = (funcStr.match(new RegExp(api, 'g')) || []).length;
    if (count > 0) {
      console.log(`   ${api}: ${count} uses`);
    }
  });
}

// Now let's check if there's an issue with the URL pattern
console.log('\n8. URL pattern edge cases:');
const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues/;
const edgeCases = [
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues', // should match
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues/', // should match
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues?page=2', // should match
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues?q=is%3Aopen', // should match
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues/1482', // should match (single issue)
  'https://github.com/issues', // should NOT match - user's issues
  'https://github.com/orgs/github/projects/123', // should NOT match
];

edgeCases.forEach(url => {
  const matches = pattern.test(url);
  console.log(`   ${matches ? '✓' : '✗'} ${url}`);
});

// Let's also check the regex more carefully
console.log('\n9. URL Pattern analysis:');
console.log('   Pattern: /^https:\\/\\/github\\.com\\/[^/]+\\/[^/]+\\/issues/');
console.log('   Issue: The [^/]+ is greedy and might not account for all cases');
console.log('   Better: /^https:\\/\\/github\\.com\\/[\\w-]+\\/[\\w-]+\\/issues/');
console.log('   Or: /^https:\\/\\/github\\.com\\/[^/]+\\/[^/]+\\/issues(?:$|\\/|\\?)/');
