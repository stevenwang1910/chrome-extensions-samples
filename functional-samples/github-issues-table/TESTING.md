# Testing Guide: GitHub Issues Table Extension

## 🚀 Quick Start Test

### 1. Load the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the folder: `c:\Users\lyxs\project\0115\chrome-extensions-samples\02\functional-samples\github-issues-table`

### 2. Basic Functionality Test
1. Navigate to: https://github.com/GoogleChrome/chrome-extensions-samples/issues
2. Click the extension icon in Chrome's toolbar
3. ✅ **Expected**: Popup should load and display issues in a table

---

## 📋 Test Cases

### Test Case 1: Table Display Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On GitHub issues page, click extension icon | Popup opens |
| 2 | Wait for loading to complete | Table displays with columns: ID, Status, Title, Submitter, Date |
| 3 | Check issue data | Each row shows: <br>• Issue ID (clickable link) <br>• Status badge (Open/Closed/PR) <br>• Issue title <br>• Submitter username (clickable) <br>• Submission date |

### Test Case 2: Refresh Button
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With popup open showing issues | Table is visible |
| 2 | Click "Refresh" button | Loading state appears |
| 3 | Wait for refresh | Issues reload and display correctly |

### Test Case 3: Navigation Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `https://github.com/GoogleChrome/chrome-extensions-samples` (not issues page) | On main repo page |
| 2 | Click extension icon | Error message: "Please navigate to the 'Issues' tab" |
| 3 | Go to `https://google.com` | On non-GitHub page |
| 4 | Click extension icon | Error message: "Please navigate to a GitHub issues page" |

### Test Case 4: Content Script Injection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On GitHub issues page, open DevTools (F12) | DevTools open |
| 2 | Go to Console tab, filter by "GitHub Issues" | Console shows content script loaded message |
| 3 | Reload GitHub page, then click extension icon | Extension should still work |
| 4 | Check Console for errors | No errors should appear |

---

## 🔍 Debugging & Troubleshooting

### Check Console Logs
1. **Content Script Logs**: On GitHub page, press F12 → Console tab
   - Look for: `=== GitHub Issues Table content script loaded ===`
   - Look for: `=== Extracting Issues from GitHub Page ===`

2. **Popup Logs**: Right-click popup → "Inspect" → Console tab
   - Check for communication errors
   - Check for extraction errors

### Common Issues & Fixes

#### Issue: "Receiving end does not exist"
**Fix**:
1. Refresh the GitHub page
2. Wait 2 seconds, then try the extension again
3. If persists: Go to `chrome://extensions/` → Reload extension

#### Issue: "No issues found"
**Fix**:
1. Check Console on GitHub page for extraction logs
2. Verify GitHub page structure hasn't changed
3. Run test script in Console: `_testExtractIssueData()`

#### Issue: Extension icon is grayed out
**Fix**:
1. Check you're on a valid GitHub issues page
2. Check manifest permissions in `chrome://extensions/`
3. Reload the extension

---

## 🧪 Unit Tests (Simulator)

### Run Simulator Test
1. Open `test-simulator.html` in browser
2. Click "Run Extraction Test"
3. ✅ **Expected**: "🎉 ALL TESTS PASSED!"

### Manual Console Test
On GitHub issues page, open Console and run:
```javascript
_testExtractIssueData()
```
Examine the output for debugging.

---

## 📊 Expected Data Format

Each issue object should have:
```javascript
{
  id: "1477",
  title: "Issue title here",
  url: "https://github.com/.../issues/1477",
  submitter: "username",
  submissionDate: "May 19, 2025",
  status: "Open"  // or "Closed", "PR", "Draft"
}
```

---

## ✅ Pre-Deployment Checklist

- [ ] Manifest loads without errors
- [ ] Content script auto-injects on issues pages
- [ ] Popup communicates with content script
- [ ] All 5 data fields extract correctly
- [ ] Links open in new tabs
- [ ] Status badges show correct colors
- [ ] No Console errors
- [ ] `npm run lint` passes
- [ ] `npx prettier --check .` passes
- [ ] Test simulator passes all tests

---

## 🐛 Bug Reporting Template

If you find a bug, please collect:
1. Chrome version
2. GitHub repository URL
3. Console logs (both content script and popup)
4. Screenshot of the issue
5. Steps to reproduce

---

**Last Updated**: May 2025
**Extension Version**: 1.0
