# GitHub Issues Viewer

A Chrome extension that extracts and displays GitHub issues from the `GoogleChrome/chrome-extensions-samples/issues` page in a table format.

## Features

- Displays issues in a clean table layout
- Shows: ID, Title, Author, Date, and Status
- Auto-detects issue status (Open/Closed)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `sample.github-issues-viewer` folder

## Usage

1. Navigate to `https://github.com/GoogleChrome/chrome-extensions-samples/issues`
2. Click the extension icon
3. View the issues displayed in table format
4. Click "Refresh" to reload the data

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Popup UI with table layout
- `popup.js` - Popup logic to fetch and display issues
- `content.js` - Content script to extract issue data from GitHub page