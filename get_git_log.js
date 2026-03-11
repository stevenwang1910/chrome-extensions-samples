const { execSync } = require('child_process');

try {
  const output = execSync('git log --oneline -20', { 
    encoding: 'utf8',
    env: { ...process.env, GIT_PAGER: '' }
  });
  console.log('Git log:');
  console.log(output);
} catch (e) {
  console.log('Error:', e.message);
}
