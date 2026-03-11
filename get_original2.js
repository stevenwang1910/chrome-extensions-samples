const { exec } = require('child_process');

exec('git cat-file -p 8755c1c:functional-samples/github-issues-extractor/popup.js', {
  cwd: 'c:\\Users\\lyxs\\project\\0115\\chrome-extensions-samples\\03',
  env: { ...process.env, GIT_PAGER: '', PAGER: '' }
}, (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  if (stderr) {
    console.log('Stderr:', stderr);
  }
  console.log('Output length:', stdout.length);
  console.log('First 2000 chars:');
  console.log(stdout.substring(0, 2000));
});
