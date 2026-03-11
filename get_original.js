const { execSync } = require('child_process');

try {
  const output = execSync('git --no-pager show 8755c1c:functional-samples/github-issues-extractor/popup.js', {
    cwd: 'c:\\Users\\lyxs\\project\\0115\\chrome-extensions-samples\\03',
    env: { ...process.env, GIT_PAGER: 'cat' }
  });
  console.log(output.toString());
} catch (e) {
  console.log('Error:', e.message);
  console.log('Stdout:', e.stdout?.toString());
  console.log('Stderr:', e.stderr?.toString());
}
