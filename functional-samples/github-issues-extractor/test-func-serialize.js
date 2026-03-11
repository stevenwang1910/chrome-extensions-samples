const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read popup.js and extract the function
const content = fs.readFileSync('popup.js', 'utf8');
const startIdx = content.indexOf('function extractIssues()');
const returnIdx = content.indexOf('return { issues, debugInfo }', startIdx);

// Find the closing brace of the function
let braceCount = 0;
let endIdx = -1;
for (let i = startIdx; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

console.log('Function range:', startIdx, 'to', endIdx);
const funcStr = content.substring(startIdx, endIdx);
console.log('Function length:', funcStr.length);

// Test 1: Can we evaluate it?
try {
  const func = eval('(' + funcStr + ')');
  console.log('✓ Function can be evaluated');
  
  // Test 2: Does it serialize properly (like Chrome does)?
  const serialized = func.toString();
  console.log('Serialized length:', serialized.length);
  
  // Test 3: Can we re-parse it?
  const func2 = eval('(' + serialized + ')');
  console.log('✓ Function can be re-parsed from serialized form');
  
  // Test 4: Run it in simulated DOM
  const html = fs.readFileSync('page.html', 'utf8');
  const dom = new JSDOM(html, { 
    url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues'
  });
  
  // Create a context
  const context = {
    document: dom.window.document,
    window: dom.window,
    console: console
  };
  
  // Execute in context
  const result = func.apply(context);
  console.log('✓ Function executed successfully');
  console.log('  Issues found:', result.issues.length);
  console.log('  First issue URL:', result.issues[0]?.url);
  
} catch (e) {
  console.log('✗ Error:', e.message);
  console.log(e.stack);
}

// Check for potential serialization issues in the function
console.log('\n=== Potential Serialization Issues Check ===');
const problematicPatterns = [
  { pattern: /=>/g, name: 'Arrow functions' },
  { pattern: /`[^`]*`/g, name: 'Template literals' },
  { pattern: /console\./g, name: 'Console calls' },
  { pattern: /let\s+\[/g, name: 'Array destructuring' },
  { pattern: /const\s+\[/g, name: 'Array destructuring (const)' },
  { pattern: /for\s*\.\.\./g, name: 'For...of loops' },
];

problematicPatterns.forEach(({ pattern, name }) => {
  const matches = funcStr.match(pattern);
  if (matches) {
    console.log(`- ${name}: ${matches.length} occurrences (should be fine in MAIN world)`);
  }
});

// Check if function uses any external references
const externalRefs = ['chrome', 'showError', 'document', 'window', 'console'];
console.log('\n=== External References Check ===');
externalRefs.forEach(ref => {
  const regex = new RegExp(`\\b${ref}\\b`, 'g');
  const matches = funcStr.match(regex);
  if (matches) {
    console.log(`- ${ref}: ${matches.length} occurrences`);
  }
});
