# GitHub Issues Extractor

This recipe shows how to extract issue information from a GitHub issues page and display it in a table format.

## Overview

This extension demonstrates how to:
- Access the current tab's DOM using `chrome.scripting.executeScript()`
- Extract structured data from a webpage
- Display the extracted data in a popup UI

## Features

The extension extracts the following information from GitHub issues pages:
- **Issue ID**: The issue number (e.g., #1477)
- **Title**: The issue title
- **Author**: The user who submitted the issue
- **Date**: The submission date
- **Status**: Open or Closed

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][1].
3. Navigate to any GitHub repository's issues page (e.g., `https://github.com/GoogleChrome/chrome-extensions-samples/issues`).
4. Click the extension icon in the toolbar.
5. Click the "Extract Issues" button to see the extracted data in a table format.

## How it works

The extension uses the `chrome.scripting.executeScript()` API to inject a content script into the active tab. The content script:

1. Queries the DOM for issue elements using multiple selectors to handle different GitHub page layouts
2. Extracts relevant data (ID, title, author, date, status) from each issue element
3. Returns the data to the popup for display

The popup then renders the data in a styled HTML table with:
- Color-coded status badges (green for open, red for closed)
- Hover effects for better readability
- Responsive layout

## Example Output

| Issue ID | Title | Author | Date | Status |
|----------|-------|--------|------|--------|
| #1477 | Issue description... | mattheimer | May 19, 2025 | Open |
| #1408 | Another issue... | username | Apr 15, 2025 | Closed |

[1]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
