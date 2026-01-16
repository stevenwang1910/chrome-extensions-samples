# GitHub Issues Extractor

This Chrome extension extracts GitHub issues information from the issues page and displays it in a structured table format. It demonstrates how to use the [chrome.scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting) API to execute scripts in the context of a web page and extract data.

## Features

- Extracts issues from GitHub issues pages
- Displays issues in a clean, organized table with the following columns:
  - **ID**: The issue number
  - **Title**: The issue title
  - **Author**: The user who opened the issue
  - **Date**: The date when the issue was opened
  - **Status**: The current status (Open/Closed)
- Color-coded status indicators (green for Open, red for Closed)
- Responsive design with hover effects

## Running This Extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to a GitHub issues page, for example:
   - [https://github.com/GoogleChrome/chrome-extensions-samples/issues](https://github.com/GoogleChrome/chrome-extensions-samples/issues)
4. Click the extension icon in the Chrome toolbar.
5. Click the "Extract Issues" button to extract and display the issues from the current page.

## How It Works

The extension uses the following Chrome APIs:

- **chrome.scripting.executeScript**: Injects a function into the active tab to extract data from the GitHub issues page
- **chrome.tabs.query**: Finds the active tab to ensure we're on a GitHub issues page

The extraction process:

1. When the user clicks "Extract Issues", the extension checks if the current tab is on a GitHub issues page
2. It then injects a script that queries the DOM for issue elements using GitHub's data attributes
3. The script extracts the issue ID, title, author, date, and status from each issue element
4. The extracted data is returned to the popup and displayed in a table

## Data Extraction

The extension extracts the following information from each issue:

- **Issue ID**: Extracted from the issue link (e.g., "#1477")
- **Title**: The main title of the issue
- **Author**: The GitHub username of the person who opened the issue
- **Date**: The date when the issue was opened (e.g., "May 19, 2025")
- **Status**: Determined by checking the issue status icon (Open/Closed)

## Example Output

| ID | Title | Author | Date | Status |
|----|-------|--------|------|--------|
| 1482 | Issue title here | username | May 29, 2025 | Open |
| 1477 | Another issue | anotheruser | May 19, 2025 | Open |
