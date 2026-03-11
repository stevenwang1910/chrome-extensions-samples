// Test to verify Chrome extension behavior
const fs = require('fs');

// Check if extractIssues function can be properly serialized
const popupContent = fs.readFileSync('./popup.js', 'utf8');

// Extract the extractIssues function
const funcMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);
if (funcMatch) {
  console.log('✓ extractIssues function found');
  const funcStr = funcMatch[0];
  console.log('\nFunction length:', funcStr.length);
  
  // Check for common serialization issues
  const issues = [];
  
  // Check for template literals with complex expressions
  if (funcStr.includes('`')) {
    console.log('⚠️  Function contains template literals (may cause issues)');
  }
  
  // Check for arrow functions in nested contexts
  if (funcStr.includes('=>')) {
    console.log('⚠️  Function contains arrow functions');
  }
  
  // Check for external references
  const externalRefs = ['chrome.', 'browser.', 'window.', 'document.'];
  externalRefs.forEach(ref => {
    if (funcStr.includes(ref) && !ref.includes('document.')) {
      console.log(`⚠️  Function contains ${ref} reference`);
    }
  });
  
  // Check if function uses any variables from outer scope
  console.log('\n=== Checking for outer scope variables ===');
  const outerVars = ['githubIssuesUrlPattern', 'showError', 'console'];
  outerVars.forEach(v => {
    const regex = new RegExp(`[^a-zA-Z0-9_]${v}[^a-zA-Z0-9_(]`);
    if (funcStr.match(regex)) {
      console.log(`⚠️  Function references outer variable: ${v}`);
    }
  });
  
  // Verify function syntax
  try {
    // This will throw if syntax is invalid
    new Function(funcStr);
    console.log('✓ Function syntax is valid');
  } catch (e) {
    console.log('✗ Function syntax error:', e.message);
  }
  
  // Try to stringify and reparse (simulate Chrome serialization)
  try {
    const funcToTest = eval(`(${funcStr})`);
    const serialized = funcToTest.toString();
    console.log('✓ Function can be serialized');
    
    // Check if serialization produces valid code
    new Function(serialized);
    console.log('✓ Serialized function is valid');
  } catch (e) {
    console.log('✗ Serialization test failed:', e.message);
  }
  
} else {
  console.log('✗ extractIssues function not found');
}

// Check popup script structure
console.log('\n=== Popup Script Structure ===');
const lines = popupContent.split('\n');
console.log('Total lines:', lines.length);

// Check for DOMContentLoaded listener
if (popupContent.includes("document.addEventListener('DOMContentLoaded'")) {
  console.log('✓ DOMContentLoaded listener found');
}

// Check chrome.scripting.executeScript call
if (popupContent.includes('chrome.scripting.executeScript')) {
  console.log('✓ chrome.scripting.executeScript call found');
  
  // Check the invocation pattern
  const execMatch = popupContent.match(/chrome\.scripting\.executeScript\(\{[\s\S]*?\}\)/);
  if (execMatch) {
    console.log('\nExecuteScript call:');
    console.log(execMatch[0].substring(0, 200) + '...');
  }
}

// Check manifest permissions
const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
console.log('\n=== Manifest Permissions ===');
console.log('Permissions:', manifest.permissions);
console.log('Host permissions:', manifest.host_permissions);

// Verify required permissions
const requiredPerms = ['activeTab', 'scripting'];
const hasAllPerms = requiredPerms.every(p => manifest.permissions.includes(p));
console.log('Has all required permissions:', hasAllPerms ? '✓' : '✗');

const hasHostPerm = manifest.host_permissions && manifest.host_permissions.includes('https://github.com/*');
console.log('Has GitHub host permission:', hasHostPerm ? '✓' : '✗');

// Test URL pattern more thoroughly
console.log('\n=== URL Pattern Testing ===');
const urlPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues/;
const testUrls = [
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues',
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues/',
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues?q=is%3Aissue+is%3Aopen',
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues/1',
  'https://github.com/google/chrome-extensions-samples/issues',
  'https://www.github.com/GoogleChrome/chrome-extensions-samples/issues', // should not match
  'http://github.com/GoogleChrome/chrome-extensions-samples/issues', // should not match
];

testUrls.forEach(url => {
  const match = urlPattern.test(url);
  console.log(`${match ? '✓' : '✗'} ${url}`);
});

console.log('\n=== Testing for Closure Issues ===');
// Check if extractIssues uses any variables from the outer scope
const extractFuncMatch = popupContent.match(/function extractIssues\(\)([\s\S]*?^})/m);
if (extractFuncMatch) {
  const funcBody = extractFuncMatch[1];
  // Check for variables defined outside the function
  const outerVars = popupContent.replace(extractFuncMatch[0], '');
  
  // Find all var/let/const declarations in outer scope
  const varDecls = outerVars.match(/(?:var|let|const)\s+(\w+)/g) || [];
  const varNames = varDecls.map(d => d.split(/\s+/)[1]);
  
  console.log('Outer scope variables:', varNames);
  
  // Check if any are used inside extractIssues
  varNames.forEach(v => {
    if (funcBody.includes(v)) {
      console.log(`⚠️  Function uses outer variable: ${v}`);
    }
  });
}
