// GitHub Issues Extractor Popup Script
// This script handles the popup UI and displays the extracted issues data

document.addEventListener('DOMContentLoaded', function() {
  const statusText = document.getElementById('status-text');
  const lastUpdated = document.getElementById('last-updated');
  const issuesTable = document.getElementById('issues-table');
  const issuesTbody = document.getElementById('issues-tbody');
  const noDataDiv = document.getElementById('no-data');
  const refreshBtn = document.getElementById('refresh-btn');
  const exportBtn = document.getElementById('export-btn');
  const statusFilter = document.getElementById('status-filter');
  
  let allIssues = [];
  let filteredIssues = [];
  
  // Load issues data from storage
  function loadIssuesData() {
    chrome.storage.local.get(['githubIssues', 'lastUpdated'], function(result) {
      if (result.githubIssues && result.githubIssues.length > 0) {
        allIssues = result.githubIssues;
        filteredIssues = [...allIssues];
        
        statusText.textContent = `Loaded ${allIssues.length} issues`;
        
        if (result.lastUpdated) {
          const lastDate = new Date(result.lastUpdated);
          lastUpdated.textContent = `Last updated: ${lastDate.toLocaleString()}`;
        }
        
        displayIssues(filteredIssues);
        issuesTable.classList.remove('hidden');
        noDataDiv.classList.add('hidden');
      } else {
        statusText.textContent = 'No issues data available';
        issuesTable.classList.add('hidden');
        noDataDiv.classList.remove('hidden');
      }
    });
  }
  
  // Display issues in the table
  function displayIssues(issues) {
    // Clear existing rows
    issuesTbody.innerHTML = '';
    
    // Add rows for each issue
    issues.forEach(issue => {
      const row = document.createElement('tr');
      
      // Issue ID
      const idCell = document.createElement('td');
      const idLink = document.createElement('a');
      idLink.href = `https://github.com/GoogleChrome/chrome-extensions-samples/issues/${issue.id}`;
      idLink.textContent = `#${issue.id}`;
      idLink.target = '_blank';
      idLink.className = 'issue-id';
      idCell.appendChild(idLink);
      row.appendChild(idCell);
      
      // Title
      const titleCell = document.createElement('td');
      titleCell.textContent = issue.title;
      titleCell.className = 'issue-title';
      titleCell.title = issue.title; // Show full title on hover
      row.appendChild(titleCell);
      
      // Author
      const authorCell = document.createElement('td');
      authorCell.textContent = issue.author;
      row.appendChild(authorCell);
      
      // Submitted Date
      const dateCell = document.createElement('td');
      if (issue.submittedDate) {
        const date = new Date(issue.submittedDate);
        dateCell.textContent = date.toLocaleDateString();
      } else {
        dateCell.textContent = 'Unknown';
      }
      row.appendChild(dateCell);
      
      // Status
      const statusCell = document.createElement('td');
      statusCell.textContent = issue.status;
      statusCell.className = issue.status === 'Open' ? 'status-open' : 'status-closed';
      row.appendChild(statusCell);
      
      issuesTbody.appendChild(row);
    });
  }
  
  // Filter issues based on status
  function filterIssues() {
    const filterValue = statusFilter.value;
    
    if (filterValue === 'all') {
      filteredIssues = [...allIssues];
    } else {
      filteredIssues = allIssues.filter(issue => 
        issue.status.toLowerCase() === filterValue
      );
    }
    
    displayIssues(filteredIssues);
    statusText.textContent = `Showing ${filteredIssues.length} of ${allIssues.length} issues`;
  }
  
  // Export issues to CSV
  function exportToCSV() {
    if (filteredIssues.length === 0) {
      statusText.textContent = 'No data to export';
      return;
    }
    
    // Create CSV content
    const headers = ['Issue ID', 'Title', 'Author', 'Submitted Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredIssues.map(issue => [
        `#${issue.id}`,
        `"${issue.title.replace(/"/g, '""')}"`, // Escape quotes in title
        issue.author,
        issue.submittedDate ? new Date(issue.submittedDate).toLocaleDateString() : '',
        issue.status
      ].join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-issues-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    statusText.textContent = `Exported ${filteredIssues.length} issues to CSV`;
  }
  
  // Refresh data by opening the GitHub issues page
  function refreshData() {
    chrome.tabs.create({
      url: 'https://github.com/GoogleChrome/chrome-extensions-samples/issues'
    }, function(tab) {
      statusText.textContent = 'Opened GitHub issues page. Data will be extracted automatically.';
    });
  }
  
  // Event listeners
  refreshBtn.addEventListener('click', refreshData);
  exportBtn.addEventListener('click', exportToCSV);
  statusFilter.addEventListener('change', filterIssues);
  
  // Initial load
  loadIssuesData();
});