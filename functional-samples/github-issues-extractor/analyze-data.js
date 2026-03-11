const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf8');

// Find all JSON script tags
const jsonScriptPattern = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
let match;

console.log('=== Analyzing page.html ===\n');

while ((match = jsonScriptPattern.exec(html)) !== null) {
  try {
    const data = JSON.parse(match[1]);
    
    // Check for preloadedQueries
    if (data.payload && data.payload.preloadedQueries) {
      console.log('Found preloadedQueries script');
      
      for (const query of data.payload.preloadedQueries) {
        console.log(`\nQuery: ${query.queryName}`);
        
        if (query.result && query.result.data) {
          const repo = query.result.data.repository;
          if (repo) {
            console.log(`  Repository URL: ${repo.url}`);
            console.log(`  Repository name: ${repo.name}`);
            console.log(`  Repository owner: ${repo.owner?.login}`);
            console.log(`  Repository resourcePath: ${repo.resourcePath}`);
            
            // Check search.edges
            if (repo.search && repo.search.edges) {
              console.log(`  Search edges: ${repo.search.edges.length}`);
              if (repo.search.edges.length > 0) {
                const firstIssue = repo.search.edges[0].node;
                console.log(`  First issue fields: ${Object.keys(firstIssue).join(', ')}`);
                console.log(`  First issue has url?: ${'url' in firstIssue}`);
                console.log(`  First issue number: ${firstIssue.number}`);
                console.log(`  First issue resourcePath: ${firstIssue.resourcePath}`);
                console.log(`  First issue repository:`, firstIssue.repository);
              }
            }
            
            // Check issues.nodes
            if (repo.issues && repo.issues.nodes) {
              console.log(`  Issues nodes: ${repo.issues.nodes.length}`);
            }
          }
        }
      }
    }
  } catch (e) {
    // Skip invalid JSON
  }
}

// Also look for the specific embedded data script
const embeddedMatch = html.match(/<script[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/);
if (embeddedMatch) {
  console.log('\n\n=== Specific embeddedData script ===\n');
  try {
    const data = JSON.parse(embeddedMatch[1]);
    const query = data.payload.preloadedQueries.find(q => q.queryName === 'IssueIndexPageQuery');
    if (query && query.result && query.result.data.repository) {
      const repo = query.result.data.repository;
      console.log('Repository URL:', repo.url);
      
      if (repo.search && repo.search.edges.length > 0) {
        const firstIssue = repo.search.edges[0].node;
        console.log('\nFirst issue full details:');
        console.log(JSON.stringify(firstIssue, null, 2).substring(0, 2000));
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

console.log('\n=== Done ===');
