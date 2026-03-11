// More accurate serialization test
const fs = require('fs');
const { VM } = require('vm2');

const popupContent = fs.readFileSync('./popup.js', 'utf8');

// Extract extractIssues function more carefully
const funcMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?^}\s*$/m);
if (!funcMatch) {
  console.log('Trying alternative extraction...');
  // Try to extract from function start to the return statement + closing
  const startIdx = popupContent.indexOf('function extractIssues()');
  const returnIdx = popupContent.indexOf('return { issues, debugInfo };', startIdx);
  const endIdx = popupContent.indexOf('}', returnIdx) + 1;
  const funcStr = popupContent.substring(startIdx, endIdx);
  console.log('Extracted function length:', funcStr.length);
  
  // Check for variable declarations inside the function
  console.log('\n=== Variable declarations inside extractIssues ===');
  const varMatches = funcStr.match(/(?:const|let|var)\s+(\w+)/g) || [];
  console.log('Internal variables:', varMatches);
  
  // Now test if the function is standalone
  console.log('\n=== Testing function in isolation ===');
  try {
    // Create a function that wraps it and provides minimal globals
    const wrapped = `
      const console = { log: () => {}, error: () => {} };
      const document = { 
        querySelector: () => null,
        querySelectorAll: () => []
      };
      ${funcStr}
      module.exports = extractIssues;
    `;
    
    // Try to compile it
    const vm = new VM({
      sandbox: {
        console: console,
        document: {
          querySelector: () => null,
          querySelectorAll: () => []
        }
      }
    });
    
    const extractedFunc = vm.run(wrapped);
    console.log('✓ Function can be isolated and run');
    
    // Test toString() serialization
    const funcToString = extractedFunc.toString();
    console.log('✓ Function toString() works:', funcToString.substring(0, 50), '...');
    
    // Check if Chrome can serialize it
    // Chrome uses toString() and then evals it in the page context
    try {
      const reconstituted = new Function('return ' + funcToString)();
      console.log('✓ Function can be reconstituted from toString()');
    } catch (e) {
      console.log('✗ Cannot reconstitute function:', e.message);
    }
    
  } catch (e) {
    console.log('✗ Isolation test failed:', e.message);
    console.log(e.stack);
  }
}

// Check for the actual chrome.scripting.executeScript call
console.log('\n=== Checking executeScript call ===');
const execPattern = /chrome\.scripting\.executeScript\(\{[\s\S]*?\}\)/;
const execMatch = popupContent.match(execPattern);
if (execMatch) {
  console.log('Call found:', execMatch[0]);
  
  // Check if func is correctly referenced
  if (execMatch[0].includes('func: extractIssues')) {
    console.log('✓ Using func: extractIssues pattern');
  } else if (execMatch[0].includes('func:')) {
    console.log('⚠️  Using different func reference');
  }
}

// Check if there's an issue with URL pattern - maybe it's matching too broadly
console.log('\n=== Checking URL pattern edge cases ===');
const edgeCases = [
  'https://github.com/settings/issues', // Not a repo
  'https://github.com/orgs/community/discussions', // Not issues
  'https://github.com/GoogleChrome/chrome-extensions-samples', // Repo root
  'https://github.com/GoogleChrome/chrome-extensions-samples/pulls', // Pulls
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues', // Good
  'https://github.com/GoogleChrome/chrome-extensions-samples/issues/123', // Good - single issue
  'https://gist.github.com/GoogleChrome/issues', // Gist
];

const urlPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues/;
edgeCases.forEach(url => {
  const match = urlPattern.test(url);
  console.log(`${match ? '✓' : '✗'} ${url}`);
});

// Check the regex - it should require at least two path segments after github.com
// before /issues
const betterPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+(?:\/|$)/;
console.log('\n=== Checking if URL is a repository ===');
edgeCases.forEach(url => {
  const isRepo = betterPattern.test(url);
  const isIssues = urlPattern.test(url);
  console.log(`${isRepo && isIssues ? '✓' : '✗'} ${url} (repo:${isRepo}, issues:${isIssues})`);
});

// Let me check what happens when we call chrome.scripting.executeScript
// The function needs to be serializable - let's test actual Chrome behavior simulation
console.log('\n=== Simulating Chrome function serialization ===');
try {
  // Extract the function as a string
  const extractIssuesFuncStr = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/)[0];
  
  // Remove comments to make it cleaner
  const cleanFunc = extractIssuesFuncStr.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Check for any references to variables that might not exist
  const globalRefs = ['window', 'document', 'console', 'JSON', 'Array', 'Object', 'String', 'Number'];
  const localVars = cleanFunc.match(/(?:const|let|var)\s+(\w+)/g)?.map(m => m.split(/\s+/)[1]) || [];
  const paramNames = ['issues', 'debugInfo'];
  const allKnown = [...globalRefs, ...localVars, ...paramNames];
  
  // Find all identifiers
  const identifiers = cleanFunc.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
  const unknownRefs = new Set();
  
  identifiers.forEach(id => {
    if (!allKnown.includes(id) && !/^(try|catch|if|else|for|while|return|function|const|let|var|new|this|true|false|null|undefined)$/.test(id)) {
      unknownRefs.add(id);
    }
  });
  
  console.log('Potential unknown references:', Array.from(unknownRefs));
  
} catch (e) {
  console.log('Error in serialization test:', e.message);
}

// Check if there are any syntax errors in the actual file
console.log('\n=== Syntax checking popup.js ===');
try {
  const vm = new VM({
    sandbox: {
      chrome: {
        tabs: {
          query: async () => [{ id: 1, url: 'https://github.com/test/test/issues' }]
        },
        scripting: {
          executeScript: async () => [{ result: { issues: [], debugInfo: {} } }]
        }
      },
      document: {
        addEventListener: () => {},
        getElementById: () => ({ style: {}, textContent: '' }),
        querySelector: () => ({ insertRow: () => ({ insertCell: () => ({ textContent: '', className: '' }) }) }),
        querySelectorAll: () => []
      },
      console: console
    }
  });
  
  // Try to run the popup script
  vm.run(popupContent);
  console.log('✓ popup.js syntax is valid and can be parsed');
} catch (e) {
  console.log('✗ popup.js has issues:', e.message);
}
