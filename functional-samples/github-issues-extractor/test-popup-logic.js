const fs = require('fs');

// Simulate the extractIssues logic with the actual data from page.html
function testExtractIssues() {
  const html = fs.readFileSync('page.html', 'utf8');
  const issues = [];
  
  // Find the embedded data
  const embeddedMatch = html.match(/<script[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/);
  if (embeddedMatch) {
    const jsonData = JSON.parse(embeddedMatch[1]);
    
    if (jsonData.payload && jsonData.payload.preloadedQueries) {
      for (const query of jsonData.payload.preloadedQueries) {
        console.log('Query name:', query.queryName);
        const repoUrl = query.result?.data?.repository?.url;
        console.log('Repo URL:', repoUrl);
        
        if (query.queryName === 'IssueIndexPageQuery' && query.result && query.result.data) {
          const searchEdges = query.result.data.repository?.search?.edges || [];
          console.log('Found', searchEdges.length, 'issues in GraphQL data');
          
          searchEdges.forEach(edge => {
            const node = edge.node;
            if (node && node.__typename === 'Issue') {
              const constructedUrl = node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null);
              console.log(`Issue #${node.number}: node.url=${node.url}, constructedUrl=${constructedUrl}`);
              
              issues.push({
                id: '#' + node.number,
                number: node.number,
                status: node.state || 'Unknown',
                title: node.title || 'No title',
                author: node.author?.login || 'Unknown',
                date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                url: constructedUrl
              });
            }
          });
        }
      }
    }
  }
  
  console.log('\n=== Final issues ===');
  issues.slice(0, 3).forEach(issue => {
    console.log(`${issue.id}: ${issue.url}`);
  });
  
  // Check if any URL is null
  const nullUrls = issues.filter(i => !i.url);
  console.log(`\nIssues with null URL: ${nullUrls.length} of ${issues.length}`);
  
  return issues;
}

testExtractIssues();
