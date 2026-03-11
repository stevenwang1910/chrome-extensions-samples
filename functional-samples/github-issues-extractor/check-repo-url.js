const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf8');

const embeddedMatch = html.match(/<script[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/);
if (embeddedMatch) {
  const data = JSON.parse(embeddedMatch[1]);
  const query = data.payload.preloadedQueries.find(q => q.queryName === 'IssueIndexPageQuery');
  if (query) {
    console.log('Query structure:', Object.keys(query));
    console.log('Result:', Object.keys(query.result));
    console.log('Data:', Object.keys(query.result.data));
    console.log('Repository:', Object.keys(query.result.data.repository));
    console.log('Repository URL:', query.result.data.repository.url);
    console.log('Repository resourcePath:', query.result.data.repository.resourcePath);
    console.log('Repository nameWithOwner:', query.result.data.repository.nameWithOwner);
    
    // Check first issue
    if (query.result.data.repository.search?.edges?.[0]) {
      const issue = query.result.data.repository.search.edges[0].node;
      console.log('\nIssue number:', issue.number);
      console.log('Issue resourcePath:', issue.resourcePath);
      
      // Check what fields issue.repository has
      console.log('\nIssue repository fields:', Object.keys(issue.repository));
    }
  }
}
