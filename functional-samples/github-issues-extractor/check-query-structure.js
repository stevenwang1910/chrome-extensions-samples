const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf8');

const embeddedMatch = html.match(/<script[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/);
if (embeddedMatch) {
  const data = JSON.parse(embeddedMatch[1]);
  console.log('preloadedQueries count:', data.payload.preloadedQueries.length);
  
  data.payload.preloadedQueries.forEach((query, idx) => {
    console.log(`\n=== Query ${idx}: ${query.queryName} ===`);
    console.log('Has result:', !!query.result);
    if (query.result?.data?.repository) {
      console.log('Repository url:', query.result.data.repository.url);
      console.log('Repository has search:', !!query.result.data.repository.search);
      if (query.result.data.repository.search?.edges) {
        console.log('Search edges count:', query.result.data.repository.search.edges.length);
        if (query.result.data.repository.search.edges.length > 0) {
          const edge = query.result.data.repository.search.edges[0];
          console.log('Edge has node:', !!edge.node);
          console.log('Node __typename:', edge.node.__typename);
          console.log('Node number:', edge.node.number);
          console.log('Node has url:', 'url' in edge.node);
        }
      }
    }
  });
  
  // Let's also check if there's a different way to get the repo URL
  console.log('\n=== Looking at variables ===');
  data.payload.preloadedQueries.forEach((query, idx) => {
    console.log(`Query ${idx} variables:`, Object.keys(query.variables));
    if (query.variables.owner) console.log('  owner:', query.variables.owner);
    if (query.variables.repo) console.log('  repo:', query.variables.repo);
  });
}
