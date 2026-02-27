# GitHub Issues Extractor

This sample demonstrates how to extract information from GitHub Issues pages and display it in a structured table format. The extension extracts issue ID, status (Open/Closed), title, author, and submission date.

## Overview

The extension uses a content script to scrape GitHub Issues page data and a popup interface to display the extracted information in a clean, tabular format with export capabilities.

## Features

- Extracts issue information from GitHub Issues pages
- Displays data in a structured table with columns:
  - **ID**: Issue number (e.g., #1477)
  - **Status**: Open or Closed
  - **Title**: Issue title
  - **Author**: Issue creator
  - **Date**: Submission date
- Export extracted data to CSV format
- Clean, responsive UI matching GitHub's design language

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `cookbook.github-issues-extractor` directory

## Usage

1. Navigate to any GitHub repository's Issues page (e.g., `https://github.com/GoogleChrome/chrome-extensions-samples/issues`)
2. Click the extension icon in the Chrome toolbar
3. Click the "Extract Issues" button in the popup
4. View the extracted data in the table
5. Optionally, click "Export CSV" to download the data

## How it works

The extension consists of three main components:

### 1. Content Script (`content-script.js`)

Injects into GitHub Issues pages and extracts issue data by:
- Querying DOM elements containing issue information
- Parsing issue IDs, titles, status, authors, and dates
- Supporting multiple selector strategies for robustness

### 2. Popup Interface (`popup.html`, `popup.css`, `popup.js`)

Provides the user interface:
- Clean, GitHub-styled design
- Table display with sortable columns
- Export functionality for CSV download
- Status messages for user feedback

### 3. Manifest (`manifest.json`)

Configures the extension with:
- `activeTab` and `scripting` permissions
- Host permissions for GitHub issues pages
- Popup action configuration

## Example Output

When visiting `https://github.com/GoogleChrome/chrome-extensions-samples/issues`, the extension extracts data like:

| ID | Status | Title | Author | Date |
|----|--------|-------|--------|------|
| #1477 | Open | Issue description here | mattheimer | May 19, 2025 |
| #1476 | Closed | Another issue | username | May 18, 2025 |

## API Reference

### Content Script Functions

#### `extractIssuesData()`
Extracts issue data from the current page using primary selectors.

**Returns:** `Array<Object>` - Array of issue objects with properties:
- `id` (string): Issue ID with # prefix
- `title` (string): Issue title
- `author` (string): Issue creator username
- `date` (string): ISO date string
- `status` (string): "Open" or "Closed"

#### `extractIssuesDataAlternative()`
Fallback method using alternative selectors when primary method returns no results.

### Popup Functions

#### `extractIssues()`
Injects content script and triggers data extraction from the active tab.

#### `renderIssues(issues)`
Renders extracted issues in the table.

#### `exportToCSV()`
Downloads extracted data as a CSV file.

## Permissions

The extension requires the following permissions:

- `activeTab`: To access the current tab's content
- `scripting`: To inject the content script
- Host permission for `https://github.com/*/issues*`: To access GitHub Issues pages

## Browser Compatibility

This extension uses Manifest V3 and is compatible with:
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers supporting Manifest V3

## License

Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
