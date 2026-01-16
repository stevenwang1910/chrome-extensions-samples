document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const error = document.getElementById('error');
    const tableBody = document.getElementById('tableBody');

    extractBtn.addEventListener('click', async function() {
        loading.classList.remove('hidden');
        results.classList.add('hidden');
        error.classList.add('hidden');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab.url && !tab.url.includes('github.com')) {
                throw new Error('Not on GitHub page');
            }

            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractIssues
            });

            if (result[0].result && result[0].result.length > 0) {
                displayIssues(result[0].result);
                results.classList.remove('hidden');
            } else {
                throw new Error('No issues found');
            }
        } catch (err) {
            error.classList.remove('hidden');
            console.error('Error extracting issues:', err);
        } finally {
            loading.classList.add('hidden');
        }
    });

    function extractIssues() {
        const issues = [];
        
        const selectors = [
            'div[class*="IssueRow-module"]',
            'div[class*="ListItems-module"]',
            'li[class*="ListItem-module"]',
            'div[data-testid="issue-list"] div[data-testid="issue"]',
            'div[id^="issue_"]',
            'div.js-issue-row',
            'div[class*="js-issue-row"]',
            'article[id^="issue_"]',
            'div[class*="Box-row"]'
        ];

        for (const selector of selectors) {
            const issueElements = document.querySelectorAll(selector);
            if (issueElements.length > 0) {
                console.log(`Found ${issueElements.length} elements using selector: ${selector}`);
                
                for (const element of issueElements) {
                    const titleElement = element.querySelector('a[href*="/issues/"]:not([href*="/issues?q="])');
                    const numberElement = element.querySelector('[data-testid="list-row-repo-name-and-number"] [class*="Number"] span, [class*="IssueItem-module__defaultNumberDescription"] span');
                    const authorElement = element.querySelector('a[data-hovercard-type="user"], a[href*="/issues?q=author:"]');
                    const dateElement = element.querySelector('relative-time, [data-testid="created-at"] relative-time');
                    const statusIcon = element.querySelector('[data-testid="list-row-state-icon"] svg');

                    if (titleElement) {
                        let issueId = 'Unknown';
                        
                        if (numberElement) {
                            const idMatch = numberElement.textContent.match(/\d+/);
                            if (idMatch) {
                                issueId = idMatch[0];
                            }
                        }
                        
                        if (issueId === 'Unknown') {
                            const hrefMatch = titleElement.href.match(/issues\/(\d+)/);
                            if (hrefMatch) {
                                issueId = hrefMatch[1];
                            }
                        }

                        const title = titleElement.textContent.trim();
                        const author = authorElement ? authorElement.textContent.trim() : 'Unknown';
                        const date = dateElement ? dateElement.textContent.trim() : 'Unknown';
                        
                        let status = 'Open';
                        if (statusIcon) {
                            const svgClass = statusIcon.getAttribute('class');
                            if (svgClass && svgClass.includes('octicon-issue-closed')) {
                                status = 'Closed';
                            } else if (svgClass && svgClass.includes('octicon-issue-opened')) {
                                status = 'Open';
                            }
                        }

                        if (issueId !== 'Unknown' || title) {
                            issues.push({
                                id: issueId,
                                title: title,
                                author: author,
                                date: date,
                                status: status
                            });
                        }
                    }
                }
                
                if (issues.length > 0) {
                    console.log(`Successfully extracted ${issues.length} issues`);
                    break;
                }
            }
        }

        if (issues.length === 0) {
            console.error('No issues found with any selector');
            console.log('Page HTML sample:', document.body.innerHTML.substring(0, 500));
        }
        
        return issues;
    }

    function displayIssues(issues) {
        tableBody.innerHTML = '';

        issues.forEach(issue => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>#${issue.id}</td>
                <td>${issue.status}</td>
                <td title="${issue.title}">${issue.title}</td>
                <td>${issue.author}</td>
                <td>${issue.date}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
});