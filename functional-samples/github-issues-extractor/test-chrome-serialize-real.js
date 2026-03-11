const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== Testing Chrome Extension Serialization (Real Scenario) ===\n');

// Read popup.js
const popupContent = fs.readFileSync('popup.js', 'utf8');

// Extract extractIssues function with brace counting
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

const funcStr = popupContent.substring(startIdx, endIdx);
console.log('Function extracted, length:', funcStr.length);

// Test 1: Check if function can be serialized like Chrome does
console.log('\n--- Test 1: Chrome-style serialization ---');
try {
  const func = eval('(' + funcStr + ')');
  const serialized = func.toString();
  console.log('✓ Function can be toString() serialized');
  console.log('  Original length:', funcStr.length);
  console.log('  Serialized length:', serialized.length);
  
  // Check for significant differences
  if (serialized.length !== funcStr.length) {
    console.log('  ⚠️  Length differs - whitespace may have changed');
  }
  
  // Test that the serialized function is still valid
  const reconstituted = eval('(' + serialized + ')');
  console.log('✓ Serialized function can be reconstituted');
} catch (e) {
  console.log('✗ Serialization test failed:', e.message);
}

// Test 2: Check for issues with arrow functions and template literals
console.log('\n--- Test 2: Language feature check ---');
const arrowFuncs = funcStr.match(/\([^)]*\)\s*=>/g);
const templateLiterals = funcStr.match(/`[^`]*`/g);
console.log('Arrow functions found:', arrowFuncs ? arrowFuncs.length : 0);
console.log('Template literals found:', templateLiterals ? templateLiterals.length : 0);

// Test 3: Check for external dependencies
console.log('\n--- Test 3: External dependency check ---');
const dependencies = [];
const checkDependency = (name) => {
  // Check if it's used but not defined inside the function
  const uses = new RegExp('[^a-zA-Z0-9_]' + name + '[^a-zA-Z0-9_]').test(funcStr);
  const defines = new RegExp('(function|const|let|var)\\s+' + name + '\\b').test(funcStr);
  if (uses && !defines) {
    // Check if it's a browser global
    const isGlobal = ['document', 'window', 'console', 'JSON', 'Set', 'RegExp'].includes(name);
    if (!isGlobal) {
      dependencies.push(name);
    }
  }
};

['showError', 'chrome', 'fetch', 'XMLHttpRequest'].forEach(checkDependency);
console.log('Potential missing dependencies:', dependencies.length > 0 ? dependencies : 'None found');

// Test 4: Test in page context with GitHub page
console.log('\n--- Test 4: Full page context test ---');
try {
  const html = fs.readFileSync('page.html', 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
    runScripts: 'dangerously',
    resources: 'usable'
  });
  
  // Inject the function
  dom.window.eval(funcStr);
  
  // Run it
  const result = dom.window.eval('extractIssues()');
  console.log('✓ extractIssues runs in page context');
  console.log('  Issues found:', result.issues.length);
  console.log('  Null URLs:', result.issues.filter(i => !i.url).length);
  
  if (result.issues.length > 0) {
    console.log('  Sample URL:', result.issues[0].url);
  }
  
} catch (e) {
  console.log('✗ Page context test failed:', e.message);
  console.log(e.stack);
}

// Test 5: Check what Chrome actually does
console.log('\n--- Test 5: Chrome executeScript simulation ---');
try {
  // Chrome's actual behavior: it takes the function, calls toString(), 
  // then wraps it and executes in the page context
  
  const func = eval('(' + funcStr + ')');
  const chromeSerialized = func.toString();
  
  // Simulate wrapping like Chrome does
  const chromeWrapper = `
    (function() {
      return (${chromeSerialized}).apply(this, arguments);
    })();
  `;
  
  const html = fs.readFileSync('page.html', 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
    runScripts: 'dangerously'
  });
  
  const result = dom.window.eval(chromeWrapper);
  console.log('✓ Chrome-style execution works');
  console.log('  Issues found:', result.issues.length);
  
} catch (e) {
  console.log('✗ Chrome simulation failed:', e.message);
  console.log(e.stack);
}

console.log('\n=== All Tests Complete ===');
