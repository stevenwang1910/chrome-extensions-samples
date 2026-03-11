// Test to simulate Chrome extension injection
const fs = require('fs');

// Read popup.js and extract the extractIssues function
const popupContent = fs.readFileSync('./popup.js', 'utf8');

// Extract function using regex
const extractFuncMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);

if (!extractFuncMatch) {
  console.log('ERROR: Could not extract function');
  process.exit(1);
}

const funcStr = extractFuncMatch[0];

console.log('=== Function Code Check ===\n');

// Check if function uses 'console' - it should be fine in Chrome
console.log('Uses console:', funcStr.includes('console.'));

// Check if function uses any variables from outer scope
const outerVars = ['showError', 'githubIssuesUrlPattern', 'tab', 'results'];
outerVars.forEach(v => {
  if (funcStr.includes(v) && !funcStr.includes(`const ${v}`) && !funcStr.includes(`let ${v}`) && !funcStr.includes(`var ${v}`)) {
    console.log(`⚠️  Possible outer scope reference: ${v}`);
  }
});

// Check if the function is "pure" - no dependencies outside itself
console.log('\n=== Function Purity Check ===\n');

// Look for all variable declarations inside function
const innerVars = funcStr.match(/(?:const|let|var)\s+(\w+)/g) || [];
const varNames = innerVars.map(m => m.split(/\s+/)[1]);
console.log('Internal variables:', varNames);

// Check for all function calls
const funcCalls = funcStr.match(/(\w+)\s*\(/g) || [];
const calledFuncs = [...new Set(funcCalls.map(m => m.trim().slice(0, -1)))];
console.log('Called functions:', calledFuncs.filter(f => !varNames.includes(f) && f !== 'function'));

// Now let's test if the function can be serialized and deserialized properly
console.log('\n=== Serialization Test ===\n');

try {
  // Create the function in a clean context
  const func = new Function('return ' + funcStr)();
  
  // Serialize it
  const serialized = func.toString();
  
  // Check if it's the same
  console.log('Original function length:', funcStr.length);
  console.log('Serialized function length:', serialized.length);
  
  // Try to deserialize
  const deserialized = new Function('return ' + serialized)();
  console.log('✓ Function can be serialized and deserialized');
  
} catch (e) {
  console.log('✗ Serialization error:', e.message);
}

// Check for Chrome-specific issues
console.log('\n=== Chrome Extension Specific Checks ===\n');

// Check if function uses template literals with backticks
const backtickCount = (funcStr.match(/`/g) || []).length;
console.log('Template literal count:', backtickCount);

// Check for arrow functions
const arrowCount = (funcStr.match(/=>/g) || []).length;
console.log('Arrow function count:', arrowCount);

// Check for optional chaining
const optionalChainCount = (funcStr.match(/\?\./g) || []).length;
console.log('Optional chaining count:', optionalChainCount);

// Check for nullish coalescing
const nullishCount = (funcStr.match(/\?\?/g) || []).length;
console.log('Nullish coalescing count:', nullishCount);

// Now let's look at the actual popup.js structure more carefully
console.log('\n=== Popup.js Structure ===\n');

// Check if extractIssues is defined inside the DOMContentLoaded callback
const domContentLoadedMatch = popupContent.match(/document\.addEventListener\('DOMContentLoaded',\s*(?:async\s*)?\(?function\)?\s*\([^)]*\)[\s\S]*$/);
if (domContentLoadedMatch) {
  console.log('DOMContentLoaded listener found');
  
  // Check if extractIssues is inside or outside
  const funcPos = popupContent.indexOf('function extractIssues()');
  const listenerStart = popupContent.indexOf("document.addEventListener('DOMContentLoaded'");
  const listenerEnd = popupContent.lastIndexOf('});');
  
  console.log('extractIssues position:', funcPos);
  console.log('Listener start:', listenerStart);
  console.log('Listener end:', listenerEnd);
  console.log('extractIssues is INSIDE listener:', funcPos > listenerStart && funcPos < listenerEnd);
}

// THIS IS THE KEY ISSUE!
// If extractIssues is defined INSIDE the DOMContentLoaded callback,
// then when chrome.scripting.executeScript tries to serialize it,
// it might not have access to the function!

console.log('\n=== Critical Check: Function Scope ===\n');

// Check the actual scoping
const lines = popupContent.split('\n');
let insideListener = false;
let extractIssuesLine = -1;
let braceCount = 0;

lines.forEach((line, i) => {
  if (line.includes("document.addEventListener('DOMContentLoaded'")) {
    insideListener = true;
    braceCount = 1; // Start counting from the opening brace
  }
  if (line.includes('function extractIssues()')) {
    extractIssuesLine = i;
    console.log(`extractIssues defined at line ${i+1}, inside listener: ${insideListener}, brace depth: ${braceCount}`);
  }
  // Count braces to track when we exit the listener
  if (insideListener) {
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;
    if (braceCount <= 0) {
      insideListener = false;
    }
  }
});

// Let's write a simple test to demonstrate the problem
console.log('\n=== Demonstrating the Scope Problem ===\n');

const testCode = `
// Simulating the current structure
document.addEventListener('DOMContentLoaded', async function() {
  // extractIssues is defined INSIDE the callback
  function extractIssues() {
    return { issues: [], debugInfo: {} };
  }
  
  // This works because extractIssues is in scope
  console.log('Inside callback:', typeof extractIssues);
  
  // But when Chrome tries to serialize the function...
  // It needs to be in the GLOBAL scope!
});

// Outside the callback - extractIssues is not accessible
console.log('Outside callback:', typeof extractIssues);
`;

console.log('The issue: extractIssues might be defined INSIDE the DOMContentLoaded callback');
console.log('This means it\'s NOT in the global scope when Chrome needs to serialize it!');

// Let's check the actual file structure
const actualExtractPos = popupContent.indexOf('function extractIssues()');
const lastClosingBrace = popupContent.lastIndexOf('}');
const firstClosingBraceAfterListener = popupContent.indexOf('});', popupContent.indexOf("document.addEventListener('DOMContentLoaded'"));

console.log('\n=== Actual Position Check ===');
console.log('extractIssues starts at char:', actualExtractPos);
console.log('DOMContentLoaded listener ends at char:', firstClosingBraceAfterListener);
console.log('extractIssues is OUTSIDE listener:', actualExtractPos > firstClosingBraceAfterListener);

// Let's actually look at the structure
console.log('\n=== Code Structure Visualization ===');
let depth = 0;
for (let i = 0; i < popupContent.length; i++) {
  if (popupContent[i] === '{') depth++;
  if (popupContent[i] === '}') depth--;
  
  if (popupContent.substring(i, i + 'function extractIssues('.length) === 'function extractIssues(') {
    console.log(`extractIssues defined at depth: ${depth}`);
    break;
  }
}

// Let's check if there are any syntax issues when running in strict mode
console.log('\n=== Strict Mode Check ===');
try {
  new Function(`'use strict'; ${funcStr}`);
  console.log('✓ Function works in strict mode');
} catch (e) {
  console.log('✗ Strict mode error:', e.message);
}

// Check for common mistakes
console.log('\n=== Common Mistakes Check ===');

// 1. Missing semicolons (unlikely to be the issue but worth checking)
// 2. Trailing commas
const trailingCommas = funcStr.match(/,\s*}/g) || [];
console.log('Trailing commas in objects:', trailingCommas.length);

// 3. Check for 'let' and 'const' usage (should be fine in Chrome)
const letCount = (funcStr.match(/\blet\s+/g) || []).length;
const constCount = (funcStr.match(/\bconst\s+/g) || []).length;
console.log('let declarations:', letCount);
console.log('const declarations:', constCount);

console.log('\n=== Summary of Potential Issues ===');
console.log('1. Function scope: Is extractIssues in the global scope?');
console.log('2. Serialization: Can Chrome properly serialize the function?');
console.log('3. Timing: Is the function injected before the page is ready?');
console.log('4. Shadow DOM: Is the content inside a shadow root?');
console.log('5. CSP: Is there a Content Security Policy issue?');

// Let's check the actual popup.js more carefully
console.log('\n=== Actual popup.js Structure ===');
const listenerStart = popupContent.indexOf("document.addEventListener('DOMContentLoaded'");
const extractStart = popupContent.indexOf('function extractIssues()');

console.log('DOMContentLoaded listener starts at:', listenerStart);
console.log('extractIssues starts at:', extractStart);
console.log('Which comes first?', extractStart < listenerStart ? 'extractIssues first - GOOD' : 'listener first - POTENTIAL ISSUE');
