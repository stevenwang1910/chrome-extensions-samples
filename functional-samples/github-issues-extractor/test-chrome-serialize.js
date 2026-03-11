const fs = require('fs');

// Read popup.js
const popupContent = fs.readFileSync('popup.js', 'utf8');

// Extract the extractIssues function
const extractIssuesMatch = popupContent.match(/function extractIssues\(\)\{[\s\S]*?return \{ issues, debugInfo \};\s*\}/);

if (extractIssuesMatch) {
  const funcStr = extractIssuesMatch[0];
  
  // Test if the function can be serialized (Chrome extensions do this)
  try {
    // Simulate what Chrome does when serializing a function
    const serialized = funcStr.toString();
    
    // Check for any syntax issues by re-parsing
    const func = new Function('return ' + serialized)();
    
    console.log('✓ Function can be serialized successfully!');
    console.log('Function length:', func.length);
    
    // Now let's check if the popup.js file has any other issues
    // Check if the DOMContentLoaded handler is properly structured
    const domHandlerMatch = popupContent.match(/document\.addEventListener\('DOMContentLoaded', async function\(\)\{[\s\S]*?\}\);/);
    
    if (domHandlerMatch) {
      console.log('✓ DOMContentLoaded handler found');
      
      // Check for chrome.scripting.executeScript call
      if (popupContent.includes('chrome.scripting.executeScript')) {
        console.log('✓ chrome.scripting.executeScript call found');
        
        // Check if world: 'MAIN' is present
        if (popupContent.includes("world: 'MAIN'")) {
          console.log('✓ world: \'MAIN\' is set correctly');
        } else {
          console.log('✗ world: \'MAIN\' is NOT set correctly');
        }
      }
    }
    
  } catch (e) {
    console.log('✗ Serialization error:', e.message);
  }
} else {
  console.log('✗ Could not extract extractIssues function');
}

// Check manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log('\n=== Manifest Check ===');
console.log('Manifest version:', manifest.manifest_version);
console.log('Permissions:', manifest.permissions);
console.log('Host permissions:', manifest.host_permissions);
console.log('Action default popup:', manifest.action?.default_popup);

// Check if manifest has required permissions
const requiredPermissions = ['activeTab', 'scripting'];
const missingPermissions = requiredPermissions.filter(p => !manifest.permissions.includes(p));
if (missingPermissions.length > 0) {
  console.log('✗ Missing permissions:', missingPermissions);
} else {
  console.log('✓ All required permissions present');
}

if (!manifest.host_permissions || !manifest.host_permissions.includes('https://github.com/*')) {
  console.log('✗ Missing host permission for github.com');
} else {
  console.log('✓ Host permission for github.com present');
}
