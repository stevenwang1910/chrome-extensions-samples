const fs = require('fs');

// Read popup.js and extract the extractIssues function
const popupContent = fs.readFileSync('popup.js', 'utf8');

// Extract the extractIssues function
const functionMatch = popupContent.match(/function extractIssues\(\)\{[\s\S]*?return \{ issues, debugInfo \};\s*\}/);
if (functionMatch) {
  console.log('Found extractIssues function');
  
  // Check for any issues that might cause serialization problems
  const funcBody = functionMatch[0];
  
  // Check for console.log statements (should be fine in MAIN world)
  console.log('console.log count:', (funcBody.match(/console\.log/g) || []).length);
  
  // Check for template literals (should be fine)
  console.log('Template literals:', (funcBody.match(/`/g) || []).length);
  
  // Check for arrow functions (should be fine)
  console.log('Arrow functions:', (funcBody.match(/=>/g) || []).length);
  
  // Try to evaluate the function
  try {
    // Wrap in IIFE to test syntax
    const wrapped = `(${funcBody})`;
    console.log('Function syntax is valid');
    
    // Extract just the function body to test in a simulated browser env
    const testScript = `
      const fs = require('fs');
      const jsdom = require('jsdom');
      const { JSDOM } = jsdom;
      
      const html = fs.readFileSync('page.html', 'utf8');
      const dom = new JSDOM(html, { url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues' });
      global.document = dom.window.document;
      global.window = dom.window;
      global.console = console;
      
      ${funcBody}
      
      const result = extractIssues();
      console.log('Issues found:', result.issues.length);
      console.log('Debug info:', JSON.stringify(result.debugInfo, null, 2));
      console.log('First issue url:', result.issues[0]?.url);
    `;
    
    console.log('\n--- Testing with jsdom ---');
    const vm = require('vm');
    const context = vm.createContext({
      require: require,
      console: console,
      process: process
    });
    vm.runInContext(testScript, context);
    
  } catch (e) {
    console.log('Error evaluating function:', e.message);
    console.log('Stack:', e.stack);
  }
} else {
  console.log('Could not find extractIssues function');
}
