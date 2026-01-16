# GitHub Issues Extractor

A Chrome extension that extracts GitHub issues data from the issues page and displays it in a clean table format.

## Features

- Extracts issue ID, status, title, author, and date from GitHub issues page
- Displays data in a sorted table
- Responsive design that works on different screen sizes
- Clean and intuitive user interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle switch in the top right)
4. Click "Load unpacked" and select the `github-issues-extractor` directory
5. The extension will now appear in your Chrome toolbar

## Usage

1. Navigate to any GitHub repository's issues page (e.g., `https://github.com/GoogleChrome/chrome-extensions-samples/issues`)
2. Click on the GitHub Issues Extractor extension icon in the Chrome toolbar
3. Click the "Extract Issues" button
4. The extension will extract and display the issues in a table format

## Data Extracted

- **Issue ID**: The unique identifier for the issue
- **Status**: The current status of the issue (e.g., Open)
- **Title**: The title of the issue
- **Author**: The username of the person who created the issue
- **Date**: The date the issue was created

## How It Works

1. The extension uses Chrome's `activeTab` and `scripting` permissions
2. When you click the "Extract Issues" button, it executes a content script in the current tab
3. The content script extracts issue data using DOM queries
4. The data is returned and displayed in a table in the popup

## File Structure

```
github-issues-extractor/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── create-icons.py
└── README.md
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Chrome Extension Manifest V3
- Python (for icon generation)

## Notes

- The extension only works on GitHub issues pages
- It requires the page to be fully loaded before extracting data
- The extension respects GitHub's terms of service and API rate limits

## License

MIT License
