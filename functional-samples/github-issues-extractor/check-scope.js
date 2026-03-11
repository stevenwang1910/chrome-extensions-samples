const fs = require('fs');
const code = fs.readFileSync('popup.js', 'utf8');

// Find the actual function positions
const domListenerStart = code.indexOf('document.addEventListener');
const extractIssuesStart = code.indexOf('function extractIssues()');

console.log('DOMContentLoaded starts at:', domListenerStart);
console.log('extractIssues starts at:', extractIssuesStart);

// Count braces properly
let braceCount = 0;
let inString = false;
let inComment = false;
let stringChar = '';
let listenerEnd = -1;

for (let i = domListenerStart; i < code.length; i++) {
  const char = code[i];
  const nextChar = code[i+1];
  
  // Handle single-line comments
  if (!inString && !inComment && char === '/' && nextChar === '/') {
    inComment = true;
  }
  if (inComment && char === '\n') {
    inComment = false;
  }
  
  // Handle multi-line comments
  if (!inString && !inComment && char === '/' && nextChar === '*') {
    inComment = true;
  }
  if (inComment && char === '*' && nextChar === '/') {
    inComment = false;
  }
  
  // Handle strings
  if (!inComment && (char === '\'' || char === '"' || char === '`')) {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (stringChar === char && code[i-1] !== '\\') {
      inString = false;
    }
  }
  
  if (!inString && !inComment) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  if (i === extractIssuesStart) {
    console.log('At extractIssues start, braceCount:', braceCount);
  }
  
  if (braceCount === 0 && i > domListenerStart + 50) {
    listenerEnd = i;
    console.log('DOMContentLoaded listener ends at:', listenerEnd);
    console.log('extractIssues is outside listener:', extractIssuesStart > listenerEnd);
    break;
  }
}

// Let's also check the first few lines
console.log('\n--- First 1000 chars of popup.js ---');
console.log(code.substring(0, 1000));
console.log('--- End of first 1000 chars ---');

// Check around line 68 (where the listener should end)
console.log('\n--- Around line 68 ---');
const lines = code.split('\n');
for (let i = 65; i < 80 && i < lines.length; i++) {
  console.log(i + 1 + ':', lines[i]);
}
console.log('--- End ---');
