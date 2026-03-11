const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the files
const pageContent = fs.readFileSync('./page.html', 'utf8');
const popupContent = fs.readFileSync('./popup.js', 'utf8');

// Extract extractIssues function from popup.js
const extractIssuesMatch = popupContent.match(/function extractIssues\(\)[\s\S]*?return \{ issues, debugInfo \};\s*\}/);
if (!extractIssuesMatch) {
  console.log('❌ Could not find extractIssues function');
  process.exit(1);
}

const extractIssuesStr = extractIssuesMatch[0];
console.log('✅ Found extractIssues function, length:', extractIssuesStr.length);

// Create a DOM environment
const dom = new JSDOM(pageContent, {
  runScripts: 'dangerously',
  resources: 'usable'
});

// Mock console
dom.window.console = {
  log: console.log,
  error: console.error
};

// Inject the function into the window context
try {
  // Create a function in the window context
  dom.window.eval(`
    ${extractIssuesStr}
    
    // Test the function
    const result = extractIssues();
    console.log('\\n=== Function Execution Result ===');
    console.log('Issues count:', result.issues.length);
    console.log('Debug info:', JSON.stringify(result.debugInfo, null, 2));
    
    if (result.issues.length > 0) {
      console.log('\\n✅ First issue:', JSON.stringify(result.issues[0], null, 2));
    }
  `);
} catch (e) {
  console.log('❌ Error executing function:', e.message);
  console.log('Stack:', e.stack);
}

// Let's also check what selectors find
console.log('\n=== Selector Tests ===');
const document = dom.window.document;

// Test the selectors used in extractIssues
const reactAppScript = document.querySelector('react-app script[data-target="react-app.embeddedData"]');
console.log('react-app script[data-target="react-app.embeddedData"]:', reactAppScript ? 'found' : 'not found');

if (reactAppScript) {
  try {
    const data = JSON.parse(reactAppScript.textContent);
    console.log('Data keys:', Object.keys(data));
    if (data.payload) {
      console.log('Payload keys:', Object.keys(data.payload));
      if (data.payload.preloadedQueries) {
        console.log('preloadedQueries count:', data.payload.preloadedQueries.length);
        data.payload.preloadedQueries.forEach((q, i) => {
          console.log(`  Query ${i}: ${q.queryName}`);
          if (q.result && q.result.data) {
            const edges = q.result.data.repository?.search?.edges || [];
            console.log(`    Issues: ${edges.length}`);
          }
        });
      }
    }
  } catch (e) {
    console.log('Error parsing JSON:', e.message);
  }
}

// Check for turbo-frame
const turboFrame = document.querySelector('turbo-frame');
console.log('turbo-frame:', turboFrame ? 'found' : 'not found');

// Check what's inside turbo-frame
if (turboFrame) {
  const scriptsInside = turboFrame.querySelectorAll('script[type="application/json"]');
  console.log('Scripts inside turbo-frame:', scriptsInside.length);
  scriptsInside.forEach((s, i) => {
    console.log(`  Script ${i}: data-target=${s.getAttribute('data-target')}`);
  });
}

// Check for react-partial (this was mentioned in debug-location.js)
const reactPartial = document.querySelectorAll('react-partial');
console.log('react-partial elements:', reactPartial.length);
reactPartial.forEach((rp, i) => {
  const scripts = rp.querySelectorAll('script[type="application/json"]');
  console.log(`  react-partial[${i}] scripts: ${scripts.length}`);
  scripts.forEach((s, j) => {
    console.log(`    script[${j}]: data-target=${s.getAttribute('data-target')}`);
    try {
      const data = JSON.parse(s.textContent);
      if (data.payload?.preloadedQueries) {
        console.log(`      has preloadedQueries: ${data.payload.preloadedQueries.length}`);
      }
    } catch (e) {}
  });
});
