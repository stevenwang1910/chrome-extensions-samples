# GitHub Issues Extractor

This Chrome extension extracts issues information from the GoogleChrome/chrome-extensions-samples GitHub repository and displays it in a table format.

## Features

- Extracts issues data from the GitHub issues page
- Displays the following information in a table:
  - Issue ID
  - Title
  - Author
  - Submitted Date
  - Status (Open/Closed)
- Filters issues by status
- Exports data to CSV format
- Automatically updates data when navigating through pages

## How to Use

1. Install the extension in Chrome developer mode
2. Visit the GitHub issues page: https://github.com/GoogleChrome/chrome-extensions-samples/issues
3. Click the extension icon to open the popup
4. View the extracted issues data in the table
5. Use the filter to show only open or closed issues
6. Export the data to CSV if needed

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Content script that extracts data from the GitHub page
- `popup.html` - Popup UI HTML
- `popup.css` - Popup UI styles
- `popup.js` - Popup UI logic and data display
- `images/` - Extension icons (to be added)

## Development Notes

The extension uses Chrome's storage API to save the extracted data, which allows the popup to access the data even after the GitHub page is closed. The content script automatically detects when new issues are loaded (e.g., when navigating through pagination) and updates the stored data.